import json
from pathlib import Path
from typing import Dict, Any
from ...AudioEffect import AudioEffect, AudioChannel
from ...AudioEffectProvider import AudioEffectProvider
from .SimpleEffect import SimpleEffect
import logging

logger = logging.getLogger(__name__)


class SimpleProvider(AudioEffectProvider):
    """Simple audio effects provider using basic DSP operations"""
    
    def __init__(self):
        super().__init__("simple")
        self.supported_effects = self._load_effects_schema()
    
    def _check_availability(self) -> bool:
        # Simple effects are always available as they only use basic operations
        return True
    
    def _load_effects_schema(self) -> Dict[str, Dict[str, Any]]:
        """Load effects schema from JSON file"""
        try:
            schema_path = Path(__file__).parent / "effects_schema.json"
            with open(schema_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load simple effects schema: {e}")
            return {}
    
    def get_supported_effects(self) -> Dict[str, Dict[str, Any]]:
        return self.supported_effects
    
    def create_effect(self, effect_type: str, channel: AudioChannel, order: int = 0) -> AudioEffect:
        if effect_type not in self.supported_effects:
            raise ValueError(f"Unsupported effect type: {effect_type}")
        
        effect = SimpleEffect(effect_type, channel, order)
        
        # Set default parameters from schema
        default_params = {}
        effect_schema = self.supported_effects[effect_type]
        for param_name, param_def in effect_schema.get("parameters", {}).items():
            default_params[param_name] = param_def.get("defaultValue")
        
        effect.set_parameters(default_params)
        return effect