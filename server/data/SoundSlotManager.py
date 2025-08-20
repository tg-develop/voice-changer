import json
import logging
import os
from dataclasses import asdict
from threading import RLock
from typing import Dict, List, Optional, Union

from .SoundSlot import SoundSlot, RandomConfig
from uuid6 import uuid7
from const import UPLOAD_DIR
from voice_changer.utils.LoadSoundParams import LoadSoundParams

logger = logging.getLogger(__name__)


class SoundSlotManager:
    """
    Manages SoundSlots stored under a base `sound_dir`.

    Each sound has its own subdirectory within `sound_dir` that contains a
    `config.json`. This manager is responsible for loading, listing,
    retrieving, saving, and updating these slot configurations.
    """

    _instance: Optional["SoundSlotManager"] = None

    def __init__(self, sound_dir: str):
        """Initialize the manager for a given `sound_dir`.

        Args:
        - sound_dir: Base directory containing subfolders per SoundSlot.
        """
        self.sound_dir = sound_dir
        self._lock = RLock()
        self._slots: Dict[str, SoundSlot] = {}
        os.makedirs(self.sound_dir, exist_ok=True)
        self._refresh()

    @classmethod
    def get_instance(cls, sound_dir: str) -> "SoundSlotManager":
        """Get a singleton instance for the provided `sound_dir`.

        Returns the existing instance or creates a new one if none exists.
        """
        if cls._instance is None:
            cls._instance = cls(sound_dir)
        return cls._instance

    # ---------------- Internal helpers ----------------
    def _slot_dir(self, slot_id: str) -> str:
        """Return the directory path for a given `slot_id`."""
        return os.path.join(self.sound_dir, slot_id)

    def _config_path(self, slot_id: str) -> str:
        """Return the `config.json` path for the given slot."""
        return os.path.join(self._slot_dir(slot_id), "config.json")

    def _load_config(self, path: str) -> Optional[SoundSlot]:
        """Load a `config.json` and build a `SoundSlot` instance from it.

        Tolerates missing/extra fields and parses `random` into `RandomConfig`.
        """
        try:
            if not os.path.isfile(path):
                return None
            with open(path, "r", encoding="utf-8") as f:
                cfg = json.load(f)

            # Map JSON to dataclass, tolerating missing/extra fields
            random_cfg = cfg.get("random")
            if isinstance(random_cfg, dict):
                try:
                    cfg["random"] = RandomConfig(
                        minPauseSec=int(random_cfg.get("minPauseSec", 3)),
                        maxPauseSec=int(random_cfg.get("maxPauseSec", 5)),
                    )
                except Exception:
                    cfg["random"] = None
            else:
                cfg["random"] = None

            # Only pass known fields
            keys = set(SoundSlot.__annotations__.keys())
            data = {k: v for k, v in cfg.items() if k in keys}
            slot = SoundSlot(**data)

            # Fallbacks
            if not slot.id:
                # infer id from parent dir name
                slot.id = os.path.basename(os.path.dirname(path))
            return slot
        except Exception as e:
            logger.warning(f"Failed to load sound slot from {path}: {e}")
            return None

    def _refresh(self) -> None:
        """Read all slot configs from disk and refresh the in-memory cache (`self._slots`)."""
        with self._lock:
            self._slots.clear()
            try:
                for name in os.listdir(self.sound_dir):
                    sub = os.path.join(self.sound_dir, name)
                    if not os.path.isdir(sub):
                        continue
                    slot = self._load_config(os.path.join(sub, "config.json"))
                    if slot is None:
                        continue
                    self._slots[slot.id] = slot
            except FileNotFoundError:
                # sound_dir might not exist yet; already created in __init__, so ignore
                pass

    # ---------------- Public API ----------------
    def reload(self) -> None:
        """Reload all SoundSlots from disk (refresh cache)."""
        self._refresh()

    def list(self) -> List[SoundSlot]:
        """Return a list of all known `SoundSlot` objects from the cache."""
        with self._lock:
            return list(self._slots.values())

    def get(self, slot_id: str) -> Optional[SoundSlot]:
        """Return the `SoundSlot` with the given `slot_id` from the cache, or `None` if absent."""
        with self._lock:
            return self._slots.get(slot_id)

    def _save(self, slot: SoundSlot) -> None:
        """[internal] Persist a `SoundSlot` configuration to its `config.json` and update the cache.

        Expects `slot.id` to be set; raises on missing id. Intended as an internal helper, used by
        `create_from_upload` and `update`.
        """
        if not slot.id:
            raise ValueError("SoundSlot.id must be set before saving")
        with self._lock:
            slot_dir = self._slot_dir(slot.id)
            os.makedirs(slot_dir, exist_ok=True)
            data = asdict(slot)
            # Convert RandomConfig dataclass to dict if present
            if isinstance(slot.random, RandomConfig):
                data["random"] = asdict(slot.random)
            with open(self._config_path(slot.id), "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            # update in-memory cache
            self._slots[slot.id] = slot

    def update(self, slot_id: str, updates: Union[str, dict]) -> Optional[SoundSlot]:
        """Update fields of a slot and persist them.

        Args:
        - slot_id: ID of the slot to update.
        - updates: Dict or JSON string with fields to set.

        Returns:
        - The updated `SoundSlot` instance, or `None` if the slot does not exist.
        """
        try:
            if isinstance(updates, str):
                updates = json.loads(updates)
        except Exception:
            # keep original if JSON parsing fails
            pass

        if not isinstance(updates, dict):
            raise ValueError("updates must be a dict or JSON string")

        with self._lock:
            slot = self._slots.get(slot_id)
            if slot is None:
                # try load from disk directly in case cache missed
                slot = self._load_config(self._config_path(slot_id))
                if slot is None:
                    return None

            # Apply updates to known fields only
            for k, v in updates.items():
                if k == "random":
                    if isinstance(v, dict):
                        try:
                            setattr(slot, "random", RandomConfig(
                                minPauseSec=int(v.get("minPauseSec", 3)),
                                maxPauseSec=int(v.get("maxPauseSec", 5)),
                            ))
                        except Exception:
                            setattr(slot, "random", None)
                    elif v is None:
                        setattr(slot, "random", None)
                    continue

                if k in SoundSlot.__annotations__:
                    try:
                        setattr(slot, k, v)
                    except Exception:
                        # ignore invalid field assignment
                        pass

            self._save(slot)
            return slot

    def delete(self, slot_id: str) -> bool:
        """Delete the slot directory and remove the slot from the cache.

        Returns:
        - True on success or if the directory is already absent, otherwise False.
        """
        from shutil import rmtree

        with self._lock:
            try:
                rmtree(self._slot_dir(slot_id), ignore_errors=True)
                self._slots.pop(slot_id, None)
                return True
            except Exception as e:
                logger.warning(f"Failed to delete sound slot {slot_id}: {e}")
                return False

    # ---------------- Creation from upload ----------------
    def create_from_upload(self, params: LoadSoundParams) -> Optional[SoundSlot]:
        """Create a new slot from an uploaded file.

        Moves the file from `upload_dir/<dir>/<name>` to `sound_dir/<id>/<dir>/<name>`,
        writes the matching `config.json` (via `_save`) and refreshes the cache.

        Returns:
        - The created `SoundSlot` instance, or `None` on failure.
        """
        try:
            # access file dict or dataclass
            file_obj = params.file

            def _get(o, key, default=None):
                if hasattr(o, key):
                    return getattr(o, key)
                if isinstance(o, dict):
                    return o.get(key, default)
                return default

            file_name = _get(file_obj, "name", "")
            file_dir = _get(file_obj, "dir", "")
            if not file_name:
                raise ValueError("params.file.name is required")

            slot_id = str(uuid7())
            name, _ = os.path.splitext(file_name)

            src_path = os.path.join(UPLOAD_DIR, file_dir, file_name)
            dst_dir = os.path.join(self.sound_dir, slot_id, file_dir)
            dst_path = os.path.join(dst_dir, file_name)
            os.makedirs(dst_dir, exist_ok=True)

            logger.info(f"Moving {src_path} -> {dst_path}")
            import shutil
            shutil.move(src_path, dst_path)

            # reflect moved file name back to params (dict or dataclass)
            new_name = os.path.basename(dst_path)
            if isinstance(file_obj, dict):
                file_obj["name"] = new_name
            else:
                try:
                    setattr(file_obj, "name", new_name)
                except Exception:
                    pass

            # Build slot from provided params
            slot = SoundSlot(**(params.params or {}))
            slot.id = slot_id
            slot.name = name
            slot.filename = new_name

            # Persist config and cache
            self._save(slot)
            return slot
        except Exception as e:
            logger.exception(e)
            return None
