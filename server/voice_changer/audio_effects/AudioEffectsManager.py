from typing import List, Dict, Any, Optional
import torch
import logging
from .AudioEffect import AudioEffect, AudioChannel
from .AudioEffectProvider import ProviderRegistry

logger = logging.getLogger(__name__)


class AudioEffectsManager:
    def __init__(self):
        self.input_effects: List[AudioEffect] = []
        self.output_effects: List[AudioEffect] = []
        self.provider_registry = ProviderRegistry()
        self._setup_default_providers()
    
    def _setup_default_providers(self) -> None:
        """Setup default audio effect providers"""
        logger.info("Setting up default audio effect providers...")
        
        try:
            from .providers.pedalboard.PedalboardProvider import PedalboardProvider
            pedalboard_provider = PedalboardProvider()
            if pedalboard_provider.is_available:
                self.provider_registry.register_provider(pedalboard_provider)
                logger.info(f"PedalboardProvider registered successfully with {len(pedalboard_provider.supported_effects)} effects")
            else:
                logger.warning("PedalboardProvider not available (pedalboard library not installed)")
        except ImportError as e:
            logger.warning(f"PedalboardProvider import failed: {e}")
        except Exception as e:
            logger.error(f"Error setting up PedalboardProvider: {e}")
        
        try:
            from .providers.simple.SimpleProvider import SimpleProvider
            simple_provider = SimpleProvider()
            if simple_provider.is_available:
                self.provider_registry.register_provider(simple_provider)
                logger.info(f"SimpleProvider registered successfully with {len(simple_provider.supported_effects)} effects")
            else:
                logger.warning("SimpleProvider not available")
        except ImportError as e:
            logger.warning(f"SimpleProvider import failed: {e}")
        except Exception as e:
            logger.error(f"Error setting up SimpleProvider: {e}")
        
        total_providers = len(self.provider_registry.providers)
        total_effects = len(self.get_supported_effects())
        logger.info(f"Audio effects setup complete: {total_providers} providers, {total_effects} total effects")
    
    def register_provider(self, provider) -> None:
        """Register a new audio effect provider"""
        self.provider_registry.register_provider(provider)
        logger.info(f"Registered audio effect provider: {provider.provider_name}")
    
    def add_effect(self, effect_type: str, channel: AudioChannel, order: int = 0, parameters: Optional[Dict[str, Any]] = None) -> AudioEffect:
        # Create effect using provider registry
        effect = self.provider_registry.create_effect(effect_type, channel, order)
        if effect is None:
            raise ValueError(f"Unknown effect type: {effect_type}")
        
        if parameters:
            # Validate parameters if possible
            if self.provider_registry.validate_effect_parameters(effect_type, parameters):
                effect.set_parameters(parameters)
            else:
                logger.warning(f"Invalid parameters for effect {effect_type}, using defaults")
        
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
    
    def get_effects_info(self) -> Dict[str, Any]:
        return {
            "input_effects": [effect.get_effect_info() for effect in self.input_effects],
            "output_effects": [effect.get_effect_info() for effect in self.output_effects],
            "available_effects": self.provider_registry.get_all_supported_effects(),
            "providers": self.provider_registry.get_providers_info()
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
    
    def get_supported_effects(self) -> Dict[str, Dict[str, Any]]:
        """Get all supported effects with their parameter schemas"""
        return self.provider_registry.get_all_supported_effects()
    
    def get_providers_info(self) -> List[Dict[str, Any]]:
        """Get information about all registered providers"""
        return self.provider_registry.get_providers_info()
    
    def validate_effect_parameters(self, effect_type: str, parameters: Dict[str, Any]) -> bool:
        """Validate parameters for a specific effect type"""
        return self.provider_registry.validate_effect_parameters(effect_type, parameters)