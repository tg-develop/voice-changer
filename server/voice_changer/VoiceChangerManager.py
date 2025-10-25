import json
import os
import sys
import shutil
import numpy as np
import logging
from voice_changer.Local.ServerAudio import ServerAudio, ServerAudioCallbacks
from voice_changer.ModelSlotManager import ModelSlotManager
from voice_changer.RVC.RVCModelMerger import RVCModelMerger
from const import STORED_SETTING_FILE, UPLOAD_DIR
from voice_changer.VoiceChangerSettings import VoiceChangerSettings
from voice_changer.VoiceChangerV2 import VoiceChangerV2
from voice_changer.utils.LoadModelParams import LoadModelParams
from voice_changer.utils.LoadSoundParams import LoadSoundParams
from voice_changer.utils.ModelMerger import MergeElement, ModelMergerRequest
from voice_changer.utils.VoiceChangerModel import AudioInOutFloat
from settings import get_settings
from voice_changer.common.deviceManager.DeviceManager import DeviceManager
from Exceptions import (
    PipelineNotInitializedException,
    VoiceChangerIsNotSelectedException,
)
from traceback import format_exc
from typing import Callable, Any
from dataclasses import asdict

from voice_changer.RVC.RVCr2 import RVCr2
from voice_changer.RVC.RVCModelSlotGenerator import RVCModelSlotGenerator  # 起動時にインポートするとパラメータが取れない。
from restapi.mods.FileUploader import upload_file
from fastapi import UploadFile
from const import UPLOAD_DIR
import os, shutil, json
from data.SoundSlotManager import SoundSlotManager

logger = logging.getLogger(__name__)


class VoiceChangerManager(ServerAudioCallbacks):
    _instance = None

    ############################
    # ServerDeviceCallbacks
    ############################
    def on_audio(self, unpackedData: AudioInOutFloat):
        return self.change_voice(unpackedData)

    def emit_to(self, volume: float, performance: list[float], err):
        self.emitToFunc(volume, performance, err)

    ############################
    # VoiceChangerManager
    ############################
    def __init__(self):
        logger.info("Initializing...")
        self.params = get_settings()

        self.modelSlotManager = ModelSlotManager.get_instance(self.params.model_dir)
        # スタティックな情報を収集

        self.settings = VoiceChangerSettings()
        try:
            with open(STORED_SETTING_FILE, "r", encoding="utf-8") as f:
                settings = json.load(f)
            self.settings.set_properties(settings)
        except:
            pass
            
        # Set the VoiceChangerSettings instance in ModelManager
        from downloader.ModelManager import set_voice_changer_settings
        set_voice_changer_settings(self.settings)

        self.device_manager = DeviceManager.get_instance()
        self.devices = self.device_manager.list_devices()
        # Ensure selected device exists; default to CPU when not available
        try:
            device_ids = [d.get("id") for d in self.devices]
            if self.settings.gpu not in device_ids:
                logger.warning(f"Configured GPU id {self.settings.gpu} not available. Defaulting to CPU.")
                self.settings.gpu = -1
        except Exception:
            # In case of any unexpected structure, still default to CPU
            self.settings.gpu = -1
        self.device_manager.initialize(self.settings.gpu, self.settings.forceFp32, self.settings.disableJit)

        self.vc = VoiceChangerV2(self.settings)
        self.server_audio = ServerAudio(self, self.settings)

        # Initialize audio effects manager once
        self.audio_effects_manager = None
        try:
            from voice_changer.audio_effects.AudioEffectsManager import AudioEffectsManager
            self.audio_effects_manager = AudioEffectsManager()
            logger.info("Audio Effects Manager Initialized.")
        except Exception as e:
            logger.warning(f"Failed to initialize audio effects manager: {e}")

        # Initialize background audio mixer
        self.audio_mixer = None
        try:
            from voice_changer.audio_mixer.AudioMixer import AudioMixer
            self.audio_mixer = AudioMixer(device=self.device_manager.device)
            logger.info("Background Tracks Manager Initialized.")
        except Exception as e:
            logger.warning(f"Failed to initialize audio mixer: {e}")

        if self.audio_mixer is not None:
            self.vc.set_audio_mixer(self.audio_mixer)

        logger.info("Initialized.")

        # Initialize the voice changer
        self.initialize(self.settings.modelSlotIndex)
        # Initialize mixer tracks from existing sound slots
        try:
            self._refresh_audio_mixer()
        except Exception as e:
            logger.warning(f"Failed to initialize audio mixer tracks: {e}")

    def store_setting(self):
        with open(STORED_SETTING_FILE, "w") as f:
            json.dump(self.settings.to_dict_stateless(), f)

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def load_model(self, params: LoadModelParams):
        slotDir = os.path.join(
            self.params.model_dir,
            str(params.slot),
        )
        if os.path.isdir(slotDir):
            shutil.rmtree(slotDir)

        for file in params.files:
            logger.info(f"FILE: {file}")
            srcPath = os.path.join(UPLOAD_DIR, file.dir, file.name)
            dstDir = os.path.join(
                self.params.model_dir,
                str(params.slot),
                file.dir,
            )
            dstPath = os.path.join(dstDir, file.name)
            os.makedirs(dstDir, exist_ok=True)
            logger.info(f"Moving {srcPath} -> {dstPath}")
            shutil.move(srcPath, dstPath)
            file.name = os.path.basename(dstPath)

        # メタデータ作成(各VCで定義)
        if params.voiceChangerType == "RVC":
            slotInfo = RVCModelSlotGenerator.load_model(params)
            self.modelSlotManager.save_model_slot(params.slot, slotInfo)

        logger.info(f"params, {params}")

    def get_info(self):
        data = self.settings.to_dict()
        data["gpus"] = self.devices
        data["modelSlots"] = self.modelSlotManager.getAllSlotInfo(reload=True)
        data["python"] = sys.version
        data["voiceChangerParams"] = self.params
        data["status"] = "OK"

        info = self.server_audio.get_info()
        data.update(info)

        info = self.vc.get_info()
        data.update(info)

        # Add audio effects schema and providers info
        if self.audio_effects_manager:
            try:
                data["audioEffectsSchema"] = self.audio_effects_manager.get_supported_effects()
                data["audioEffectsProviders"] = {
                    "providers": self.audio_effects_manager.get_providers_info(),
                    "total_effects": len(self.audio_effects_manager.get_supported_effects())
                }
            except Exception as e:
                logger.warning(f"Failed to load audio effects info: {e}")
                data["audioEffectsSchema"] = {}
                data["audioEffectsProviders"] = {"providers": [], "total_effects": 0}
        else:
            data["audioEffectsSchema"] = {}
            data["audioEffectsProviders"] = {"providers": [], "total_effects": 0}

        # Add audio backgrounds info
        try:
            sound_mgr = SoundSlotManager.get_instance(self.params.sound_dir)
            data["audioBackgrounds"] = [asdict(s) for s in sound_mgr.list()]
        except Exception as e:
            logger.warning(f"Failed to load audio backgrounds info: {e}")
            data["audioBackgrounds"] = []

        return data

    def initialize(self, val: int):
        slotInfo = self.modelSlotManager.get_slot_info(val)
        if slotInfo is None or slotInfo.voiceChangerType is None:
            logger.warning(f"Model slot is not found {val}")
            return

        self.settings.set_properties({
            'tran': slotInfo.defaultTune,
            'formantShift': slotInfo.defaultFormantShift,
            'indexRatio': slotInfo.defaultIndexRatio,
            'protect': slotInfo.defaultProtect
        })

        if slotInfo.voiceChangerType == self.vc.get_type():
            self.vc.set_slot_info(slotInfo)
        elif slotInfo.voiceChangerType == "RVC":
            logger.info("Loading RVC...")
            self.vc.initialize(RVCr2(slotInfo, self.settings))
        else:
            logger.error(f"Unknown voice changer model: {slotInfo.voiceChangerType}")

        # Attach audio mixer to the voice processor
        try:
            if self.audio_mixer is not None and hasattr(self.vc, 'set_audio_mixer'):
                self.vc.set_audio_mixer(self.audio_mixer)
                # Apply initial configuration if present
                if hasattr(self.settings, 'audioBackgrounds') and self.settings.audioBackgrounds is not None:
                    self.audio_mixer.set_tracks(self.settings.audioBackgrounds, output_sr=self.settings.outputSampleRate)
        except Exception as e:
            logger.warning(f"Failed to attach audio mixer: {e}")

    def update_settings(self, key: str, val: Any):
        # Only log audio effects changes at debug level to reduce noise
        if key == 'audioEffects':
            logger.debug(f"update configuration {key}: {val}")
        else:
            logger.info(f"update configuration {key}: {val}")
        error, old_value = self.settings.set_property(key, val)
        if error:
            return self.get_info()
        # TODO: This is required to get type-casted setting. But maybe this should be done prior to setting.
        val = self.settings.get_property(key)
        if old_value == val:
            return self.get_info()
        # TODO: Storing settings on each change is suboptimal. Maybe timed autosave?
        self.store_setting()

        if key == "modelSlotIndex":
            logger.info(f"Model slot is changed {old_value} -> {val}")
            self.initialize(val)
        elif key == 'gpu':
            self.device_manager.set_device(val)
        elif key == 'forceFp32':
            self.device_manager.set_force_fp32(val)
        elif key == 'disableJit':
            self.device_manager.set_disable_jit(val)
        # FIXME: This is a very counter-intuitive handling of audio modes...
        # Map "serverAudioSampleRate" to "inputSampleRate" and "outputSampleRate"
        # since server audio can have its sample rate configured.
        # Revert change in case we switched back to client audio mode.
        elif key == 'enableServerAudio':
            if val:
                self.update_settings('inputSampleRate', self.settings.serverAudioSampleRate)
                self.update_settings('outputSampleRate', self.settings.serverAudioSampleRate)
            else:
                self.update_settings('inputSampleRate', 48000)
                self.update_settings('outputSampleRate', 48000)
        elif key == 'serverAudioSampleRate':
            self.update_settings('inputSampleRate', self.settings.serverAudioSampleRate)
            self.update_settings('outputSampleRate', self.settings.serverAudioSampleRate)
        elif key == 'audioEffects':
            # Configure audio effects on the pipeline
            if hasattr(self.vc, 'vcmodel') and self.vc.vcmodel is not None and hasattr(self.vc.vcmodel, 'pipeline') and self.vc.vcmodel.pipeline is not None:
                self.vc.vcmodel.pipeline.configure_audio_effects(self.settings.to_dict())
                logger.debug("Audio effects configuration updated")
        elif key == 'audioBackgrounds':
            # Configure background audio mixer
            try:
                if self.audio_mixer is not None:
                    self.audio_mixer.set_tracks(self.settings.audioBackgrounds, output_sr=self.settings.outputSampleRate)
                    logger.info("Audio background tracks updated")
            except Exception as e:
                logger.warning(f"Failed to update audioBackgrounds: {e}")

        self.server_audio.update_settings(key, val, old_value)
        self.vc.update_settings(key, val, old_value)

        return self.get_info()

    def change_voice(self, receivedData: AudioInOutFloat) -> tuple[AudioInOutFloat, tuple, tuple | None]:
        if self.settings.passThrough:  # パススルー
            vol = float(np.sqrt(
                np.square(receivedData).mean(dtype=np.float32)
            ))
            return receivedData, vol, [0, 0, 0], None

        try:
            with self.device_manager.lock:
                audio, vol, perf = self.vc.on_request(receivedData)
            return audio, vol, perf, None
        except VoiceChangerIsNotSelectedException as e:
            logger.exception(e)
            return np.zeros(1, dtype=np.float32), 0, [0, 0, 0], ('VoiceChangerIsNotSelectedException', format_exc())
        except PipelineNotInitializedException as e:
            logger.exception(e)
            return np.zeros(1, dtype=np.float32), 0, [0, 0, 0], ('PipelineNotInitializedException', format_exc())
        except Exception as e:
            logger.exception(e)
            return np.zeros(1, dtype=np.float32), 0, [0, 0, 0], ('Exception', format_exc())


    # ---------------- Models ----------------

    def export2onnx(self):
        return self.vc.export2onnx()

    async def merge_models(self, request: str) -> str | None:
        # self.vc.merge_models(request)
        req = json.loads(request)
        req = ModelMergerRequest(**req)
        req.files = [MergeElement(**f) for f in req.files]
        # Slots range is 0-499
        slot = len(self.modelSlotManager.getAllSlotInfo()) - 1
        if req.voiceChangerType == "RVC":
            RVCModelMerger.merge_models(self.params, req, slot)
        return self.get_info()

    def setEmitTo(self, emitTo: Callable[[Any], None]):
        self.emitToFunc = emitTo

    def update_model_default(self):
        # self.vc.update_model_default()
        current_settings = self.vc.get_current_model_settings()
        for setting in current_settings:
            self.modelSlotManager.update_model_info(self.settings.modelSlotIndex, **setting)
        return self.get_info()

    def update_model_info(self, newData: str):
        # Accept JSON string with keys: slot, key, val
        try:
            data = json.loads(newData) if isinstance(newData, str) else newData
        except Exception:
            data = newData

        # Backward compatibility: allow passing dict directly or list of settings
        if isinstance(data, list):
            for setting in data:
                # expected: {"key": "...", "val": any}
                self.modelSlotManager.update_model_info(self.settings.modelSlotIndex, setting.get("key"), setting.get("val"))
        elif isinstance(data, dict):
            slot = int(data.get("slot", self.settings.modelSlotIndex))
            key = data.get("key")
            val = data.get("val")
            self.modelSlotManager.update_model_info(slot, key, val)
        else:
            # If an unexpected payload arrives, do nothing graceful
            logger.warning(f"update_model_info received unsupported payload: {type(data)}")

        return self.get_info()

    def upload_model_assets(self, params: str):
        # self.vc.upload_model_assets(params)
        self.modelSlotManager.store_model_assets(params)
        return self.get_info()

    # ---------------- Sounds (Background Assets) ----------------

    async def load_sound(self, params: LoadSoundParams):
        # Delegate creation/move to the SoundSlotManager
        try:
            mgr = SoundSlotManager.get_instance(self.params.sound_dir)
            mgr.create_from_upload(params)
            # Update mixer with latest tracks
            self._refresh_audio_mixer()
        except Exception as e:
            logger.warning(f"Failed to load sound: {e}")
        return self.get_info()

    def update_sound_info(self, soundId: str, key: str, val: str):
        try:
            # Try to parse the value to its correct type (bool, float, or string)
            val_parsed = None
            if key == 'random':
                try:
                    val_parsed = json.loads(val)
                except json.JSONDecodeError:
                    val_parsed = val  # Fallback if parsing fails
            elif val.lower() == 'true':
                val_parsed = True
            elif val.lower() == 'false':
                val_parsed = False
            else:
                try:
                    val_parsed = float(val)
                except ValueError:
                    val_parsed = val

            config = {key: val_parsed}
            mgr = SoundSlotManager.get_instance(self.params.sound_dir)
            mgr.update(soundId, config)
            self.sound_slot_manager = mgr
            # Update mixer with latest tracks
            self._refresh_audio_mixer()
        except Exception as e:
            logger.exception(e)
        return self.get_info()

    def delete_sound(self, soundId: str):
        try:
            mgr = SoundSlotManager.get_instance(self.params.sound_dir)
            mgr.delete(soundId)
            # Update mixer with latest tracks
            self._refresh_audio_mixer()
        except Exception as e:
            logger.warning(f"Failed to delete sound {soundId}: {e}")
        return self.get_info()

    # ---------------- Internal: update background mixer ----------------
    def _refresh_audio_mixer(self):
        """Sync AudioMixer tracks from SoundSlotManager."""
        if self.audio_mixer is None:
            return
        try:
            mgr = SoundSlotManager.get_instance(self.params.sound_dir)
            slots = mgr.list()
            # Map SoundSlot -> AudioMixer config
            cfg = []
            for s in slots:
                try:
                    # Files are stored at sound_dir/<id>/(optional dir)/<filename>.
                    # In our upload flow, dir is "", so path = "<id>/<filename>".
                    # The mixer resolves this relative to sound_dir.
                    path = f"{s.id}/{s.filename}" if getattr(s, 'filename', '') else ''
                    item = {
                        'id': s.id,
                        'path': path,
                        'enabled': bool(getattr(s, 'enabled', False)),
                        'gainDb': float(getattr(s, 'gainDb', 0.0)),
                        'mode': getattr(s, 'mode', 'loop') or 'loop',
                        'loopPauseSec': float(getattr(s, 'loopPauseSec', 0) or 0),
                    }
                    rnd = getattr(s, 'random', None)
                    if rnd is not None:
                        # random is a dataclass RandomConfig(minPauseSec, maxPauseSec)
                        item['random'] = {
                            'minPauseSec': int(getattr(rnd, 'minPauseSec', 3)),
                            'maxPauseSec': int(getattr(rnd, 'maxPauseSec', 5)),
                        }
                    cfg.append(item)
                except Exception:
                    # Skip faulty slot
                    continue
            out_sr = int(self.settings.outputSampleRate)
            self.audio_mixer.set_tracks(cfg, output_sr=out_sr)
        except Exception as e:
            logger.warning(f"Failed to refresh audio mixer: {e}")
