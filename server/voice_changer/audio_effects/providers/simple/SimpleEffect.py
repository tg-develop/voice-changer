import torch
import numpy as np
from typing import Dict, Any
from ...AudioEffect import AudioEffect, AudioChannel
import logging

logger = logging.getLogger(__name__)


class SimpleEffect(AudioEffect):
    """Simple audio effect implementation using basic DSP operations"""
    
    def __init__(self, effect_type: str, channel: AudioChannel, order: int = 0):
        super().__init__(effect_type, channel, order)
        self._init_effect()
    
    def _init_effect(self):
        """Initialize internal state for the effect"""
        if self.effect_type == "gain":
            # No internal state needed for gain
            pass
        elif self.effect_type == "lowpass":
            # Simple IIR filter state
            self._filter_state = 0.0
        elif self.effect_type == "highpass":
            # Simple IIR filter state
            self._filter_state = 0.0
            self._prev_input = 0.0
        elif self.effect_type == "delay":
            # Delay buffer
            max_delay_samples = int(48000 * 2)  # 2 seconds at 48kHz
            self._delay_buffer = torch.zeros(max_delay_samples)
            self._delay_index = 0
    
    def set_parameters(self, parameters: Dict[str, Any]) -> None:
        super().set_parameters(parameters)
        self._init_effect()  # Reinitialize if needed
    
    def process(self, audio: torch.Tensor, sample_rate: int) -> torch.Tensor:
        if not self.enabled:
            return audio
        
        try:
            if self.effect_type == "gain":
                return self._apply_gain(audio)
            elif self.effect_type == "lowpass":
                return self._apply_lowpass(audio, sample_rate)
            elif self.effect_type == "highpass":
                return self._apply_highpass(audio, sample_rate)
            elif self.effect_type == "delay":
                return self._apply_delay(audio, sample_rate)
            else:
                return audio
        except Exception as e:
            logger.error(f"Error in {self.effect_type} effect: {e}")
            return audio
    
    def _apply_gain(self, audio: torch.Tensor) -> torch.Tensor:
        """Apply simple gain adjustment"""
        gain_db = self.parameters.get("gain", 0.0)
        gain_linear = 10 ** (gain_db / 20.0)
        return audio * gain_linear
    
    def _apply_lowpass(self, audio: torch.Tensor, sample_rate: int) -> torch.Tensor:
        """Apply simple IIR low-pass filter"""
        cutoff = self.parameters.get("cutoff", 1000.0)
        # Simple one-pole IIR filter
        rc = 1.0 / (2.0 * np.pi * cutoff)
        dt = 1.0 / sample_rate
        alpha = dt / (rc + dt)
        
        output = audio.clone()
        for i in range(len(audio)):
            self._filter_state = alpha * audio[i] + (1.0 - alpha) * self._filter_state
            output[i] = self._filter_state
        
        return output
    
    def _apply_highpass(self, audio: torch.Tensor, sample_rate: int) -> torch.Tensor:
        """Apply simple IIR high-pass filter"""
        cutoff = self.parameters.get("cutoff", 1000.0)
        # Simple one-pole IIR high-pass filter
        rc = 1.0 / (2.0 * np.pi * cutoff)
        dt = 1.0 / sample_rate
        alpha = rc / (rc + dt)
        
        output = audio.clone()
        for i in range(len(audio)):
            current_input = audio[i]
            output[i] = alpha * (self._filter_state + current_input - self._prev_input)
            self._filter_state = output[i]
            self._prev_input = current_input
        
        return output
    
    def _apply_delay(self, audio: torch.Tensor, sample_rate: int) -> torch.Tensor:
        """Apply simple delay effect"""
        delay_time = self.parameters.get("delayTime", 300.0) / 1000.0  # Convert ms to seconds
        feedback = self.parameters.get("feedback", 0.3)
        wet_level = self.parameters.get("wetLevel", 0.3)
        
        delay_samples = int(delay_time * sample_rate)
        if delay_samples >= len(self._delay_buffer):
            delay_samples = len(self._delay_buffer) - 1
        
        output = audio.clone()
        for i in range(len(audio)):
            # Get delayed sample
            delayed_sample = self._delay_buffer[self._delay_index]
            
            # Mix dry and wet signals
            output[i] = audio[i] + wet_level * delayed_sample
            
            # Update delay buffer with input + feedback
            self._delay_buffer[self._delay_index] = audio[i] + feedback * delayed_sample
            
            # Advance delay index
            self._delay_index = (self._delay_index + 1) % len(self._delay_buffer)
        
        return output