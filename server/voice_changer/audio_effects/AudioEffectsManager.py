from typing import List, Dict, Any, Optional
import torch
import logging
from .AudioEffect import AudioEffect, AudioChannel

logger = logging.getLogger(__name__)


class AudioEffectsManager:
    def __init__(self):
        self.input_effects: List[AudioEffect] = []
        self.output_effects: List[AudioEffect] = []
        self.available_effects: Dict[str, type] = {}
    
    def register_effect(self, effect_type: str, effect_class: type) -> None:
        self.available_effects[effect_type] = effect_class
        logger.info(f"Registered audio effect: {effect_type}")
    
    def add_effect(self, effect_type: str, channel: AudioChannel, order: int = 0, parameters: Optional[Dict[str, Any]] = None) -> AudioEffect:
        if effect_type not in self.available_effects:
            raise ValueError(f"Unknown effect type: {effect_type}")
        
        effect_class = self.available_effects[effect_type]
        effect = effect_class(effect_type, channel, order)
        
        if parameters:
            effect.set_parameters(parameters)
        
        if channel == "input":
            self.input_effects.append(effect)
            # Sort by order after adding
            self.input_effects.sort(key=lambda x: x.order)
        elif channel == "output":
            self.output_effects.append(effect)
            # Sort by order after adding
            self.output_effects.sort(key=lambda x: x.order)
        
        logger.info(f"Added {effect_type} effect to {channel} chain with order {order}")
        return effect
    
    def remove_effect(self, effect: AudioEffect) -> None:
        if effect in self.input_effects:
            self.input_effects.remove(effect)
        if effect in self.output_effects:
            self.output_effects.remove(effect)
        logger.info(f"Removed {effect.effect_type} effect")
    
    def clear_effects(self, channel: Optional[AudioChannel] = None) -> None:
        if channel is None or channel == "input":
            self.input_effects.clear()
        if channel is None or channel == "output":
            self.output_effects.clear()
        logger.info(f"Cleared effects for {channel or 'all'} channel(s)")
    
    def process_input_chain(self, audio: torch.Tensor, sample_rate: int) -> torch.Tensor:
        try:
            processed_audio = audio.clone()
            for effect in self.input_effects:
                if effect.is_enabled():
                    processed_audio = effect.process(processed_audio, sample_rate)
            return processed_audio
        except Exception as e:
            logger.error(f"Error in input effects chain: {e}")
            return audio
    
    def process_output_chain(self, audio: torch.Tensor, sample_rate: int) -> torch.Tensor:
        try:
            processed_audio = audio.clone()
            for effect in self.output_effects:
                if effect.is_enabled():
                    processed_audio = effect.process(processed_audio, sample_rate)
            return processed_audio
        except Exception as e:
            logger.error(f"Error in output effects chain: {e}")
            return audio
    
    def get_effects_info(self) -> Dict[str, List[Dict[str, Any]]]:
        return {
            "input_effects": [effect.get_effect_info() for effect in self.input_effects],
            "output_effects": [effect.get_effect_info() for effect in self.output_effects],
            "available_effects": list(self.available_effects.keys())
        }
    
    def update_effect_parameters(self, effect_type: str, channel: AudioChannel, order: int, parameters: Dict[str, Any]) -> bool:
        effects_list = []
        
        if channel == "input":
            effects_list = self.input_effects
        elif channel == "output":
            effects_list = self.output_effects
        
        updated = False
        for effect in effects_list:
            if effect.effect_type == effect_type and effect.channel == channel and effect.order == order:
                effect.set_parameters(parameters)
                updated = True
        
        return updated
    
    def reorder_effects(self) -> None:
        """Re-sort effects by order in case orders were changed"""
        self.input_effects.sort(key=lambda x: x.order)
        self.output_effects.sort(key=lambda x: x.order)
        logger.info("Effects reordered by priority")
    
    def get_effect_by_id(self, effect_type: str, channel: AudioChannel, order: int) -> Optional[AudioEffect]:
        """Get a specific effect by type, channel and order"""
        effects_list = self.input_effects if channel == "input" else self.output_effects
        
        for effect in effects_list:
            if effect.effect_type == effect_type and effect.order == order:
                return effect
        return None