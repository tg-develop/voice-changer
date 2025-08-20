import os
import math
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

import torch
from torchaudio import transforms as tat
import torchaudio
from settings import get_settings


@dataclass
class BackgroundTrack:
    id: str
    path: str
    enabled: bool = True
    gainDb: float = -6.0
    mode: str = 'loop'  # 'loop' | 'random'
    loopPauseSec: float = 0.0
    random: Optional[Dict[str, float]] = None  # { minPauseSec, maxPauseSec }

    # runtime state (samples domain)
    _audio: Optional[torch.Tensor] = field(default=None, repr=False)
    _sr: int = field(default=0, repr=False)
    _resampled: Optional[torch.Tensor] = field(default=None, repr=False)
    _pos: int = field(default=0, repr=False)
    _pause_remaining: int = field(default=0, repr=False)


class AudioMixer:
    """Simple background audio mixer. Preloads mono tensors and renders blocks at output SR."""

    def __init__(self, device: Optional[torch.device] = None):
        self.device = device or torch.device('cpu')
        self.tracks: List[BackgroundTrack] = []
        self._output_sr = 48000

    def _to_mono(self, wav: torch.Tensor) -> torch.Tensor:
        if wav.dim() == 1:
            return wav
        # torchaudio returns (channels, samples)
        if wav.size(0) > 1:
            return wav.mean(dim=0)
        return wav.squeeze(0)

    def _resample_to(self, wav: torch.Tensor, sr: int, target_sr: int) -> torch.Tensor:
        if sr == target_sr:
            return wav
        resampler = tat.Resample(orig_freq=sr, new_freq=target_sr, dtype=torch.float32)
        return resampler(wav.unsqueeze(0)).squeeze(0)

    def _load_track(self, t: BackgroundTrack, output_sr: int) -> None:
        try:
            # Resolve relative filenames against configured sound_dir
            sound_dir = get_settings().sound_dir
            src = t.path
            if src and not os.path.isabs(src):
                src = os.path.join(sound_dir, src)
            if not src or not os.path.isfile(src):
                return
            wav, sr = torchaudio.load(src)
            wav = wav.to(torch.float32)
            wav = self._to_mono(wav)
            wav = self._resample_to(wav, sr, output_sr)
            t._audio = wav.contiguous()
            t._sr = output_sr
            t._resampled = t._audio
            t._pos = 0
            t._pause_remaining = 0
        except Exception:
            # on failure, keep track disabled at runtime
            t._audio = None
            t.enabled = False

    def set_tracks(self, cfg: Any, output_sr: Optional[int] = None) -> None:
        """Configure tracks from settings payload.
        Expected cfg: list of { id, path, enabled, gainDb, mode, loopPauseSec, random: {minPauseSec, maxPauseSec} }
        """
        if cfg is None:
            # if explicitly None, clear all
            self.tracks.clear()
            return
        # Determine target SR
        target_sr = output_sr or self._output_sr
        sr_changed = target_sr != self._output_sr
        self._output_sr = target_sr

        def to_float(val, default):
            try:
                return float(val)
            except Exception:
                return default

        # Map existing tracks by id for reuse
        existing: Dict[str, BackgroundTrack] = {t.id: t for t in self.tracks}
        new_tracks: List[BackgroundTrack] = []

        for i, item in enumerate(cfg if isinstance(cfg, list) else []):
            path = item.get('path') or item.get('filename') or item.get('url') or ''
            tid = str(item.get('id', f'track_{i}'))
            enabled = bool(item.get('enabled', True))
            gainDb = to_float(item.get('gainDb', -6.0), -6.0)
            mode = str(item.get('mode', 'loop'))
            loopPauseSec = to_float(item.get('loopPauseSec', 0.0), 0.0)
            random_cfg = item.get('random') if isinstance(item.get('random'), dict) else None

            t_old = existing.get(tid)
            if t_old is not None and t_old.path == path and t_old._resampled is not None and not sr_changed:
                # Reuse existing runtime state, update parameters only
                prev_enabled = t_old.enabled
                t_old.enabled = enabled
                t_old.gainDb = gainDb
                t_old.mode = mode
                t_old.loopPauseSec = loopPauseSec
                t_old.random = random_cfg
                # If track transitions from disabled->enabled, restart from beginning
                if (not prev_enabled) and enabled:
                    t_old._pos = 0
                    t_old._pause_remaining = 0
                # Ensure SR consistency if it somehow drifted
                if t_old._sr != self._output_sr and t_old._audio is not None:
                    # resample and reset position only on SR change
                    t_old._resampled = self._resample_to(t_old._audio, t_old._sr, self._output_sr)
                    t_old._sr = self._output_sr
                    t_old._pos = 0
                    t_old._pause_remaining = 0
                new_tracks.append(t_old)
            else:
                # New track or path changed or SR changed; (re)load
                t_new = BackgroundTrack(
                    id=tid,
                    path=path,
                    enabled=enabled,
                    gainDb=gainDb,
                    mode=mode,
                    loopPauseSec=loopPauseSec,
                    random=random_cfg,
                )
                self._load_track(t_new, self._output_sr)
                new_tracks.append(t_new)

        # Replace track list with reconciled tracks
        self.tracks = new_tracks

    def _pick_random_pause(self, t: BackgroundTrack) -> int:
        import random
        if not t.random:
            return 0
        mn = float(t.random.get('minPauseSec', 2.0))
        mx = float(t.random.get('maxPauseSec', 5.0))
        if mx < mn:
            mx = mn
        sec = random.uniform(mn, mx)
        return int(round(sec * self._output_sr))

    def _gain_linear(self, db: float) -> float:
        return 10.0 ** (db / 20.0)

    @torch.no_grad()
    def render(self, block_size: int, output_sr: int, device: Optional[torch.device] = None) -> torch.Tensor:
        if device is None:
            device = self.device
        if output_sr != self._output_sr:
            self._output_sr = output_sr
            # re-resample existing tracks to new SR
            for t in self.tracks:
                if t._audio is not None and t._sr != output_sr:
                    t._resampled = self._resample_to(t._audio, t._sr, output_sr)
                    t._sr = output_sr
                    t._pos = 0
                    t._pause_remaining = 0

        if not self.tracks:
            return torch.zeros(block_size, dtype=torch.float32, device=device)

        mix = torch.zeros(block_size, dtype=torch.float32)
        for t in self.tracks:
            if not t.enabled or t._resampled is None:
                continue

            remaining = block_size
            write_pos = 0
            while remaining > 0:
                # handle pause state
                if t.mode == 'random' and t._pause_remaining > 0:
                    step = min(remaining, t._pause_remaining)
                    t._pause_remaining -= step
                    remaining -= step
                    write_pos += step
                    continue

                audio = t._resampled
                if t.mode == 'loop':
                    # if in loop pause
                    if t._pause_remaining > 0:
                        step = min(remaining, t._pause_remaining)
                        t._pause_remaining -= step
                        remaining -= step
                        write_pos += step
                        continue
                # compute copy length
                if t._pos >= audio.numel():
                    # reached end
                    if t.mode == 'loop':
                        # schedule loop pause then reset
                        t._pause_remaining = int(round(max(0.0, t.loopPauseSec) * self._output_sr))
                        t._pos = 0
                        continue
                    elif t.mode == 'random':
                        # schedule random pause and restart
                        t._pause_remaining = self._pick_random_pause(t)
                        t._pos = 0
                        continue
                    else:
                        break
                available = audio.numel() - t._pos
                step = min(available, remaining)
                if step <= 0:
                    break

                segment = audio[t._pos:t._pos+step]
                mix[write_pos:write_pos+step] += segment * self._gain_linear(t.gainDb)
                t._pos += step
                remaining -= step
                write_pos += step

        return mix.to(device)
