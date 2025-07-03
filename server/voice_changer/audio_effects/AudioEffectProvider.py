from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Type
import torch
import logging
from .AudioEffect import AudioEffect, AudioChannel

logger = logging.getLogger(__name__)


class AudioEffectProvider(ABC):
    """
    Abstract base class for audio effect providers.
    Different audio libraries (Pedalboard, PyDub, etc.) can implement this interface
    to provide their specific effects while maintaining a consistent API.
    """
    
    def __init__(self, provider_name: str):
        self.provider_name = provider_name
        self.supported_effects: Dict[str, Dict[str, Any]] = {}
        self.is_available = self._check_availability()
    
    @abstractmethod
    def _check_availability(self) -> bool:
        """Check if the provider's dependencies are available"""
        pass
    
    @abstractmethod
    def get_supported_effects(self) -> Dict[str, Dict[str, Any]]:
        """
        Return a dictionary of supported effects and their parameter schemas.
        Format: {
            "effect_name": {
                "description": "Effect description",
                "parameters": {
                    "param_name": {
                        "type": "float|int|str|bool",
                        "default": value,
                        "min": min_value,  # optional
                        "max": max_value,  # optional
                        "options": [...]   # optional for string/enum types
                    }
                }
            }
        }
        """
        pass
    
    @abstractmethod
    def create_effect(self, effect_type: str, channel: AudioChannel, order: int = 0) -> AudioEffect:
        """Create and return an AudioEffect instance of the specified type"""
        pass
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Return information about this provider"""
        return {
            "name": self.provider_name,
            "available": self.is_available,
            "supported_effects": list(self.supported_effects.keys()),
            "effect_count": len(self.supported_effects)
        }
    
    def validate_effect_parameters(self, effect_type: str, parameters: Dict[str, Any]) -> bool:
        """Validate parameters for a specific effect type"""
        if effect_type not in self.supported_effects:
            return False
        
        effect_schema = self.supported_effects[effect_type]
        param_schema = effect_schema.get("parameters", {})
        
        for param_name, param_value in parameters.items():
            if param_name not in param_schema:
                logger.warning(f"Unknown parameter '{param_name}' for effect '{effect_type}'")
                continue
            
            param_def = param_schema[param_name]
            param_type = param_def.get("type", "float")
            
            # Type checking
            if param_type == "float" and not isinstance(param_value, (int, float)):
                return False
            elif param_type == "int" and not isinstance(param_value, int):
                return False
            elif param_type == "str" and not isinstance(param_value, str):
                return False
            elif param_type == "bool" and not isinstance(param_value, bool):
                return False
            
            # Range checking
            if isinstance(param_value, (int, float)):
                if "min" in param_def and param_value < param_def["min"]:
                    return False
                if "max" in param_def and param_value > param_def["max"]:
                    return False
            
            # Options checking
            if "options" in param_def and param_value not in param_def["options"]:
                return False
        
        return True


class ProviderRegistry:
    """Registry to manage multiple audio effect providers"""
    
    def __init__(self):
        self.providers: Dict[str, AudioEffectProvider] = {}
        self._effect_to_provider: Dict[str, str] = {}
    
    def register_provider(self, provider: AudioEffectProvider) -> None:
        """Register a new audio effect provider"""
        if not provider.is_available:
            logger.warning(f"Provider '{provider.provider_name}' is not available (missing dependencies)")
            return
        
        self.providers[provider.provider_name] = provider
        
        # Map effect types to provider
        for effect_type in provider.get_supported_effects():
            if effect_type in self._effect_to_provider:
                existing_provider = self._effect_to_provider[effect_type]
                logger.debug(f"Effect '{effect_type}' already registered by provider '{existing_provider}', "
                             f"overriding with '{provider.provider_name}'")
            self._effect_to_provider[effect_type] = provider.provider_name
        
        logger.info(f"Registered audio effect provider: {provider.provider_name} "
                   f"({len(provider.get_supported_effects())} effects)")
    
    def get_provider_for_effect(self, effect_type: str) -> Optional[AudioEffectProvider]:
        """Get the provider that handles a specific effect type"""
        provider_name = self._effect_to_provider.get(effect_type)
        if provider_name:
            return self.providers.get(provider_name)
        return None
    
    def create_effect(self, effect_type: str, channel: AudioChannel, order: int = 0) -> Optional[AudioEffect]:
        """Create an effect using the appropriate provider"""
        provider = self.get_provider_for_effect(effect_type)
        if provider:
            return provider.create_effect(effect_type, channel, order)
        return None
    
    def get_all_supported_effects(self) -> Dict[str, Dict[str, Any]]:
        """Get all supported effects from all providers"""
        all_effects = {}
        for provider in self.providers.values():
            provider_effects = provider.get_supported_effects()
            for effect_type, effect_info in provider_effects.items():
                all_effects[effect_type] = {
                    **effect_info,
                    "provider": provider.provider_name
                }
        return all_effects
    
    def get_providers_info(self) -> List[Dict[str, Any]]:
        """Get information about all registered providers"""
        provider_info = []
        all_effects = self.get_all_supported_effects()
        
        for provider in self.providers.values():
            # Count effects that are actually available from this provider in the final schema
            provider_effects_in_schema = [
                effect_type for effect_type, effect_data in all_effects.items()
                if effect_data.get("provider") == provider.provider_name
            ]
            
            info = provider.get_provider_info()
            info["effect_count"] = len(provider_effects_in_schema)
            provider_info.append(info)
        
        return provider_info
    
    def validate_effect_parameters(self, effect_type: str, parameters: Dict[str, Any]) -> bool:
        """Validate parameters for a specific effect type"""
        provider = self.get_provider_for_effect(effect_type)
        if provider:
            return provider.validate_effect_parameters(effect_type, parameters)
        return False