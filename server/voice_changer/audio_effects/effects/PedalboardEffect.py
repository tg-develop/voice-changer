import torch
import numpy as np
from typing import Dict, Any
from ..AudioEffect import AudioEffect, AudioChannel

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
    import logging
    logger = logging.getLogger(__name__)
    logger.warning("Pedalboard not available, audio effects will be disabled")


class PedalboardEffect(AudioEffect):
    """Universal Pedalboard effect wrapper"""
    
    def __init__(self, effect_type: str, channel: AudioChannel, order: int = 0):
        super().__init__(effect_type, channel, order)
        self.effect_type = effect_type
        self._effect = None
        self._setup_parameters()
        self._init_effect()
    
    def _setup_parameters(self):
        """Setup default parameters based on effect type"""
        if self.effect_type == "reverb":
            self.parameters = {"roomSize": 0.5, "damping": 0.3, "wetDryMix": 0.3, "preDelay": 20.0}
        elif self.effect_type == "compressor":
            self.parameters = {"threshold": -15.0, "ratio": 4.0, "attack": 5.0, "release": 50.0}
        elif self.effect_type == "echo":
            self.parameters = {"delayTime": 300.0, "feedback": 0.4, "wetLevel": 0.3, "highCut": 8000.0}
        elif self.effect_type == "equalizer":
            self.parameters = {"low": 0.0, "lowMid": 0.0, "mid": 0.0, "highMid": 0.0, "high": 0.0}
        elif self.effect_type == "chorus":
            self.parameters = {"rate": 1.5, "depth": 0.3, "mix": 0.5, "voiceCount": 3}
        elif self.effect_type == "distortion":
            self.parameters = {"drive": 0.3, "tone": 0.5, "level": 0.7, "type": "soft"}
        elif self.effect_type == "noiseGate":
            self.parameters = {"threshold": -30.0, "ratio": 10.0, "attack": 5.0, "release": 100.0}
        elif self.effect_type == "gain":
            self.parameters = {"gain": 0.0}  # dB
        elif self.effect_type == "lowpass":
            self.parameters = {"cutoff": 8000.0, "resonance": 0.7}
        elif self.effect_type == "highpass":
            self.parameters = {"cutoff": 100.0, "resonance": 0.7}
        elif self.effect_type == "bitcrush":
            self.parameters = {"bitDepth": 8}
        elif self.effect_type == "clipping":
            self.parameters = {"threshold": -6.0}
        elif self.effect_type == "limiter":
            self.parameters = {"threshold": -3.0, "release": 50.0}
        elif self.effect_type == "invert":
            self.parameters = {}
        elif self.effect_type == "ladderFilter":
            self.parameters = {"cutoff": 1000.0, "resonance": 0.7, "drive": 1.0, "mode": "LPF12"}
        elif self.effect_type == "peakFilter":
            self.parameters = {"cutoff": 1000.0, "gain": 0.0, "q": 1.0}
        elif self.effect_type == "highShelfFilter":
            self.parameters = {"cutoff": 8000.0, "gain": 0.0, "q": 0.7}
        elif self.effect_type == "lowShelfFilter":
            self.parameters = {"cutoff": 200.0, "gain": 0.0, "q": 0.7}
        elif self.effect_type == "convolution":
            self.parameters = {"impulseResponse": "hall", "mix": 0.3}
        elif self.effect_type == "mp3Compressor":
            self.parameters = {"vbrQuality": 2}
        elif self.effect_type == "gsmCompressor":
            self.parameters = {}
    
    def _init_effect(self):
        """Initialize the pedalboard effect"""
        if not PEDALBOARD_AVAILABLE:
            return
        
        try:
            if self.effect_type == "reverb":
                self._effect = Reverb(
                    room_size=self.parameters["roomSize"],
                    damping=self.parameters["damping"],
                    wet_level=self.parameters["wetDryMix"],
                    dry_level=1.0 - self.parameters["wetDryMix"]
                )
            elif self.effect_type == "compressor":
                self._effect = Compressor(
                    threshold_db=self.parameters["threshold"],
                    ratio=self.parameters["ratio"],
                    attack_ms=self.parameters["attack"],
                    release_ms=self.parameters["release"]
                )
            elif self.effect_type == "echo":
                delay = Delay(
                    delay_seconds=self.parameters["delayTime"] / 1000.0,
                    feedback=self.parameters["feedback"],
                    mix=self.parameters["wetLevel"]
                )
                high_cut = LowpassFilter(cutoff_frequency_hz=self.parameters["highCut"])
                self._effect = Pedalboard([delay, high_cut])
            
            elif self.effect_type == "equalizer":
                eq_filters = []
                if abs(self.parameters["low"]) > 0.1:
                    eq_filters.append(LowShelfFilter(cutoff_frequency_hz=80, gain_db=self.parameters["low"]))
                if abs(self.parameters["lowMid"]) > 0.1:
                    eq_filters.append(PeakFilter(cutoff_frequency_hz=320, gain_db=self.parameters["lowMid"]))
                if abs(self.parameters["mid"]) > 0.1:
                    eq_filters.append(PeakFilter(cutoff_frequency_hz=1250, gain_db=self.parameters["mid"]))
                if abs(self.parameters["highMid"]) > 0.1:
                    eq_filters.append(PeakFilter(cutoff_frequency_hz=5000, gain_db=self.parameters["highMid"]))
                if abs(self.parameters["high"]) > 0.1:
                    eq_filters.append(HighShelfFilter(cutoff_frequency_hz=12500, gain_db=self.parameters["high"]))
                self._effect = Pedalboard(eq_filters) if eq_filters else None
            
            elif self.effect_type == "chorus":
                self._effect = Chorus(
                    rate_hz=self.parameters["rate"],
                    depth=self.parameters["depth"],
                    mix=self.parameters["mix"]
                )
            elif self.effect_type == "distortion":
                self._effect = Distortion(drive_db=self.parameters["drive"] * 20)  # Scale 0-1 to 0-20dB
            
            elif self.effect_type == "noiseGate":
                self._effect = NoiseGate(
                    threshold_db=self.parameters["threshold"],
                    ratio=self.parameters["ratio"],
                    attack_ms=self.parameters["attack"],
                    release_ms=self.parameters["release"]
                )
            elif self.effect_type == "gain":
                self._effect = Gain(gain_db=self.parameters["gain"])
            
            elif self.effect_type == "lowpass":
                self._effect = LowpassFilter(
                    cutoff_frequency_hz=self.parameters["cutoff"]
                )
            elif self.effect_type == "highpass":
                self._effect = HighpassFilter(
                    cutoff_frequency_hz=self.parameters["cutoff"]
                )
            
            elif self.effect_type == "bitcrush":
                self._effect = Bitcrush(bit_depth=self.parameters["bitDepth"])
            
            elif self.effect_type == "clipping":
                self._effect = Clipping(threshold_db=self.parameters["threshold"])
            
            elif self.effect_type == "limiter":
                self._effect = Limiter(
                    threshold_db=self.parameters["threshold"],
                    release_ms=self.parameters["release"]
                )
            
            elif self.effect_type == "invert":
                self._effect = Invert()
            
            elif self.effect_type == "ladderFilter":
                # Map string mode to LadderFilter mode
                mode_map = {
                    "LPF12": LadderFilter.Mode.LPF12,
                    "LPF24": LadderFilter.Mode.LPF24,
                    "HPF12": LadderFilter.Mode.HPF12,
                    "HPF24": LadderFilter.Mode.HPF24,
                    "BPF12": LadderFilter.Mode.BPF12,
                    "BPF24": LadderFilter.Mode.BPF24
                }
                mode = mode_map.get(self.parameters["mode"], LadderFilter.Mode.LPF12)
                self._effect = LadderFilter(
                    mode=mode,
                    cutoff_hz=self.parameters["cutoff"],
                    resonance=self.parameters["resonance"],
                    drive=self.parameters["drive"]
                )
            
            elif self.effect_type == "peakFilter":
                self._effect = PeakFilter(
                    cutoff_frequency_hz=self.parameters["cutoff"],
                    gain_db=self.parameters["gain"],
                    q=self.parameters["q"]
                )
            
            elif self.effect_type == "highShelfFilter":
                self._effect = HighShelfFilter(
                    cutoff_frequency_hz=self.parameters["cutoff"],
                    gain_db=self.parameters["gain"],
                    q=self.parameters["q"]
                )
            
            elif self.effect_type == "lowShelfFilter":
                self._effect = LowShelfFilter(
                    cutoff_frequency_hz=self.parameters["cutoff"],
                    gain_db=self.parameters["gain"],
                    q=self.parameters["q"]
                )
            
            elif self.effect_type == "convolution":
                # For convolution, we would need actual impulse response files
                # This is a simplified implementation using built-in reverb as fallback
                if self.parameters["impulseResponse"] == "hall":
                    # Use reverb as a fallback since we don't have actual IR files
                    self._effect = Reverb(
                        room_size=0.8,
                        damping=0.2,
                        wet_level=self.parameters["mix"],
                        dry_level=1.0 - self.parameters["mix"]
                    )
                else:
                    # Other IR types - simplified reverb settings
                    room_sizes = {"room": 0.3, "plate": 0.6, "spring": 0.4, "cathedral": 0.9}
                    room_size = room_sizes.get(self.parameters["impulseResponse"], 0.5)
                    self._effect = Reverb(
                        room_size=room_size,
                        damping=0.3,
                        wet_level=self.parameters["mix"],
                        dry_level=1.0 - self.parameters["mix"]
                    )
            
            elif self.effect_type == "mp3Compressor":
                self._effect = MP3Compressor(vbr_quality=self.parameters["vbrQuality"])
            
            elif self.effect_type == "gsmCompressor":
                self._effect = GSMFullRateCompressor()
                
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
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
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in {self.effect_type} effect: {e}")
            return audio