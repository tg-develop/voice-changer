import torch
import numpy as np
from typing import Dict, Any
from ...AudioEffect import AudioEffect, AudioChannel
import logging

logger = logging.getLogger(__name__)

try:
    from pedalboard import (
        Reverb, Compressor, Delay, LowpassFilter, Pedalboard,
        LowShelfFilter, HighShelfFilter, PeakFilter,
        Chorus, Distortion, NoiseGate, Gain, HighpassFilter,
        Bitcrush, Clipping, Limiter, Invert, LadderFilter,
        Convolution, MP3Compressor, GSMFullRateCompressor
    )
    PEDALBOARD_AVAILABLE = True
except ImportError:
    PEDALBOARD_AVAILABLE = False
    logger.warning("Pedalboard not available, pedalboard effects will be disabled")


class PedalboardEffect(AudioEffect):
    """Pedalboard-specific audio effect implementation"""
    
    def __init__(self, effect_type: str, channel: AudioChannel, order: int = 0):
        super().__init__(effect_type, channel, order)
        self._effect = None
        self._init_effect()
    
    def _init_effect(self):
        """Initialize the pedalboard effect"""
        if not PEDALBOARD_AVAILABLE:
            return
        
        try:
            if self.effect_type == "reverb":
                self._effect = Reverb(
                    room_size=self.parameters.get("roomSize", 0.5),
                    damping=self.parameters.get("damping", 0.3),
                    wet_level=self.parameters.get("wetDryMix", 0.3),
                    dry_level=1.0 - self.parameters.get("wetDryMix", 0.3)
                )
            elif self.effect_type == "compressor":
                self._effect = Compressor(
                    threshold_db=self.parameters.get("threshold", -20.0),
                    ratio=self.parameters.get("ratio", 4.0),
                    attack_ms=self.parameters.get("attack", 10.0),
                    release_ms=self.parameters.get("release", 100.0)
                )
            elif self.effect_type == "echo":
                delay = Delay(
                    delay_seconds=self.parameters.get("delayTime", 300.0) / 1000.0,
                    feedback=self.parameters.get("feedback", 0.4),
                    mix=self.parameters.get("wetLevel", 0.3)
                )
                high_cut = LowpassFilter(cutoff_frequency_hz=self.parameters.get("highCut", 8000.0))
                self._effect = Pedalboard([delay, high_cut])
            
            elif self.effect_type == "equalizer":
                eq_filters = []
                if abs(self.parameters.get("low", 0.0)) > 0.1:
                    eq_filters.append(LowShelfFilter(cutoff_frequency_hz=80, gain_db=self.parameters["low"]))
                if abs(self.parameters.get("lowMid", 0.0)) > 0.1:
                    eq_filters.append(PeakFilter(cutoff_frequency_hz=320, gain_db=self.parameters["lowMid"]))
                if abs(self.parameters.get("mid", 0.0)) > 0.1:
                    eq_filters.append(PeakFilter(cutoff_frequency_hz=1250, gain_db=self.parameters["mid"]))
                if abs(self.parameters.get("highMid", 0.0)) > 0.1:
                    eq_filters.append(PeakFilter(cutoff_frequency_hz=5000, gain_db=self.parameters["highMid"]))
                if abs(self.parameters.get("high", 0.0)) > 0.1:
                    eq_filters.append(HighShelfFilter(cutoff_frequency_hz=12500, gain_db=self.parameters["high"]))
                self._effect = Pedalboard(eq_filters) if eq_filters else None
            
            elif self.effect_type == "chorus":
                self._effect = Chorus(
                    rate_hz=self.parameters.get("rate", 1.5),
                    depth=self.parameters.get("depth", 0.3),
                    mix=self.parameters.get("mix", 0.5)
                )
            elif self.effect_type == "distortion":
                self._effect = Distortion(drive_db=self.parameters.get("drive", 0.3) * 20)
            
            elif self.effect_type == "noiseGate":
                self._effect = NoiseGate(
                    threshold_db=self.parameters.get("threshold", -30.0),
                    ratio=self.parameters.get("ratio", 10.0),
                    attack_ms=self.parameters.get("attack", 5.0),
                    release_ms=self.parameters.get("release", 100.0)
                )
            elif self.effect_type == "gain":
                self._effect = Gain(gain_db=self.parameters.get("gain", 0.0))
            
            elif self.effect_type == "lowpass":
                self._effect = LowpassFilter(cutoff_frequency_hz=self.parameters.get("cutoff", 8000.0))
            elif self.effect_type == "highpass":
                self._effect = HighpassFilter(cutoff_frequency_hz=self.parameters.get("cutoff", 100.0))
            
            elif self.effect_type == "bitcrush":
                self._effect = Bitcrush(bit_depth=self.parameters.get("bitDepth", 8))
            elif self.effect_type == "clipping":
                self._effect = Clipping(threshold_db=self.parameters.get("threshold", -6.0))
            elif self.effect_type == "limiter":
                self._effect = Limiter(
                    threshold_db=self.parameters.get("threshold", -3.0),
                    release_ms=self.parameters.get("release", 50.0)
                )
            elif self.effect_type == "invert":
                self._effect = Invert()
            
            elif self.effect_type == "ladderFilter":
                mode_map = {
                    "LPF12": LadderFilter.Mode.LPF12,
                    "LPF24": LadderFilter.Mode.LPF24,
                    "HPF12": LadderFilter.Mode.HPF12,
                    "HPF24": LadderFilter.Mode.HPF24,
                    "BPF12": LadderFilter.Mode.BPF12,
                    "BPF24": LadderFilter.Mode.BPF24
                }
                mode = mode_map.get(self.parameters.get("mode", "LPF12"), LadderFilter.Mode.LPF12)
                self._effect = LadderFilter(
                    mode=mode,
                    cutoff_hz=self.parameters.get("cutoff", 1000.0),
                    resonance=self.parameters.get("resonance", 0.7),
                    drive=self.parameters.get("drive", 1.0)
                )
            
            elif self.effect_type == "peakFilter":
                self._effect = PeakFilter(
                    cutoff_frequency_hz=self.parameters.get("cutoff", 1000.0),
                    gain_db=self.parameters.get("gain", 0.0),
                    q=self.parameters.get("q", 1.0)
                )
            
            elif self.effect_type == "highShelfFilter":
                self._effect = HighShelfFilter(
                    cutoff_frequency_hz=self.parameters.get("cutoff", 8000.0),
                    gain_db=self.parameters.get("gain", 0.0),
                    q=self.parameters.get("q", 0.7)
                )
            
            elif self.effect_type == "lowShelfFilter":
                self._effect = LowShelfFilter(
                    cutoff_frequency_hz=self.parameters.get("cutoff", 200.0),
                    gain_db=self.parameters.get("gain", 0.0),
                    q=self.parameters.get("q", 0.7)
                )
            
            elif self.effect_type == "convolution":
                # Simplified convolution using reverb as fallback
                if self.parameters.get("impulseResponse") == "hall":
                    self._effect = Reverb(
                        room_size=0.8,
                        damping=0.2,
                        wet_level=self.parameters.get("mix", 0.3),
                        dry_level=1.0 - self.parameters.get("mix", 0.3)
                    )
                else:
                    room_sizes = {"room": 0.3, "plate": 0.6, "spring": 0.4, "cathedral": 0.9}
                    room_size = room_sizes.get(self.parameters.get("impulseResponse", "hall"), 0.5)
                    self._effect = Reverb(
                        room_size=room_size,
                        damping=0.3,
                        wet_level=self.parameters.get("mix", 0.3),
                        dry_level=1.0 - self.parameters.get("mix", 0.3)
                    )
            
            elif self.effect_type == "mp3Compressor":
                self._effect = MP3Compressor(vbr_quality=self.parameters.get("vbrQuality", 2))
            elif self.effect_type == "gsmCompressor":
                self._effect = GSMFullRateCompressor()
                
        except Exception as e:
            logger.error(f"Failed to initialize {self.effect_type} effect: {e}")
            self._effect = None
    
    def set_parameters(self, parameters: Dict[str, Any]) -> None:
        super().set_parameters(parameters)
        self._init_effect()  # Reinitialize with new parameters
    
    def process(self, audio: torch.Tensor, sample_rate: int) -> torch.Tensor:
        if not self.enabled or not PEDALBOARD_AVAILABLE or self._effect is None:
            return audio
        
        try:
            # Convert to numpy
            audio_np = audio.detach().cpu().numpy().copy().astype(np.float32)
            
            # Pedalboard expects 2D array (channels, samples)
            if audio_np.ndim == 1:
                audio_np = audio_np.reshape(1, -1)
            
            # Apply effect
            processed = self._effect(audio_np, sample_rate)
            
            # Convert back to 1D if needed
            if processed.ndim == 2 and processed.shape[0] == 1:
                processed = processed[0]
            
            # Convert back to torch tensor
            return torch.tensor(processed.copy(), dtype=audio.dtype, device=audio.device)
            
        except Exception as e:
            logger.error(f"Error in {self.effect_type} effect: {e}")
            return audio