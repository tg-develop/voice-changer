import json
import os
from pathlib import Path
from typing import Dict, Any
from ...AudioEffect import AudioEffect, AudioChannel
from ...AudioEffectProvider import AudioEffectProvider
from .PedalboardEffect import PedalboardEffect, PEDALBOARD_AVAILABLE
import logging

logger = logging.getLogger(__name__)


class PedalboardProvider(AudioEffectProvider):
    """Audio effect provider for Pedalboard library"""
    
    def __init__(self):
        super().__init__("pedalboard")
        self.supported_effects = self._load_effects_schema()
    
    def _check_availability(self) -> bool:
        return PEDALBOARD_AVAILABLE
    
    def _load_effects_schema(self) -> Dict[str, Dict[str, Any]]:
        """Load effects schema from JSON file"""
        try:
            schema_path = Path(__file__).parent / "effects_schema.json"
            with open(schema_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load pedalboard effects schema: {e}")
            return {}
    
    def get_supported_effects(self) -> Dict[str, Dict[str, Any]]:
        return self.supported_effects
    
    def create_effect(self, effect_type: str, channel: AudioChannel, order: int = 0) -> AudioEffect:
        if effect_type not in self.supported_effects:
            raise ValueError(f"Unsupported effect type: {effect_type}")
        
        effect = PedalboardEffect(effect_type, channel, order)
        
        # Set default parameters from schema
        default_params = {}
        effect_schema = self.supported_effects[effect_type]
        for param_name, param_def in effect_schema.get("parameters", {}).items():
            default_params[param_name] = param_def.get("defaultValue")
        
        effect.set_parameters(default_params)
        return effect
    
    def validate_effect_parameters(self, effect_type: str, parameters: Dict[str, Any]) -> bool:
        """Enhanced parameter validation using schema"""
        if effect_type not in self.supported_effects:
            return False
        
        effect_schema = self.supported_effects[effect_type]
        param_schemas = effect_schema.get("parameters", {})
        
        for param_name, param_value in parameters.items():
            if param_name not in param_schemas:
                logger.warning(f"Unknown parameter '{param_name}' for effect '{effect_type}'")
                continue
            
            param_def = param_schemas[param_name]
            param_type = param_def.get("type", "slider")
            
            # Type and value validation based on UI type
            if param_type == "slider":
                if not isinstance(param_value, (int, float)):
                    logger.error(f"Parameter '{param_name}' must be numeric, got {type(param_value)}")
                    return False
                
                # Range checking
                if "min" in param_def and param_value < param_def["min"]:
                    logger.error(f"Parameter '{param_name}' value {param_value} below minimum {param_def['min']}")
                    return False
                if "max" in param_def and param_value > param_def["max"]:
                    logger.error(f"Parameter '{param_name}' value {param_value} above maximum {param_def['max']}")
                    return False
            
            elif param_type == "select":
                if not isinstance(param_value, str):
                    logger.error(f"Parameter '{param_name}' must be string, got {type(param_value)}")
                    return False
                
                # Options checking
                if "options" in param_def and param_value not in param_def["options"]:
                    logger.error(f"Parameter '{param_name}' value '{param_value}' not in allowed options {param_def['options']}")
                    return False
        
        return True