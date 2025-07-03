from typing import Dict, List, Any, Optional
import json
import logging
from .AudioEffectsManager import AudioEffectsManager
from .AudioEffect import AudioChannel

logger = logging.getLogger(__name__)


class AudioEffectsConfig:
    @staticmethod
    def parse_effects_from_config(config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Parse audioEffects from frontend configuration
        
        Expected format:
        "audioEffects": [
            {
                "type": "reverb",
                "channel": "input", 
                "enabled": true,
                "parameters": {"roomSize": 0.5, "damping": 0.3, ...}
            }
        ]
        """
        audio_effects = config.get("audioEffects", [])
        if not isinstance(audio_effects, list):
            logger.warning("audioEffects should be a list, got: %s", type(audio_effects))
            return []
        
        parsed_effects = []
        for i, effect_config in enumerate(audio_effects):
            try:
                if not isinstance(effect_config, dict):
                    logger.warning("Effect config at index %d is not a dict: %s", i, effect_config)
                    continue
                
                effect_type = effect_config.get("type")
                channel = effect_config.get("channel")
                enabled = effect_config.get("enabled", True)
                parameters = effect_config.get("parameters", {})
                
                if not effect_type:
                    logger.warning("Effect at index %d missing 'type' field", i)
                    continue
                
                if channel not in ["input", "output"]:
                    logger.warning("Effect at index %d has invalid channel: %s", i, channel)
                    continue
                
                parsed_effect = {
                    "type": effect_type,
                    "channel": channel,
                    "enabled": enabled,
                    "parameters": parameters,
                    "order": i  # Use index as order for now
                }
                
                parsed_effects.append(parsed_effect)
                logger.info("Parsed effect: %s on %s channel", effect_type, channel)
                
            except Exception as e:
                logger.error("Error parsing effect at index %d: %s", i, e)
                continue
        
        return parsed_effects
    
    @staticmethod
    def apply_effects_to_manager(effects_manager: AudioEffectsManager, 
                               effects_config: List[Dict[str, Any]]) -> None:
        """
        Apply parsed effects configuration to AudioEffectsManager
        """
        # Clear existing effects
        effects_manager.clear_effects()
        
        # Group effects by channel and sort by order
        input_effects = sorted(
            [e for e in effects_config if e["channel"] == "input"],
            key=lambda x: x["order"]
        )
        output_effects = sorted(
            [e for e in effects_config if e["channel"] == "output"], 
            key=lambda x: x["order"]
        )
        
        # Add input effects
        for effect in input_effects:
            try:
                added_effect = effects_manager.add_effect(
                    effect_type=effect["type"],
                    channel="input",
                    order=effect["order"],
                    parameters=effect["parameters"]
                )
                added_effect.set_enabled(effect["enabled"])
                logger.info("Added input effect: %s (order: %d, enabled: %s)", 
                          effect["type"], effect["order"], effect["enabled"])
            except Exception as e:
                logger.error("Failed to add input effect %s: %s", effect["type"], e)
        
        # Add output effects  
        for effect in output_effects:
            try:
                added_effect = effects_manager.add_effect(
                    effect_type=effect["type"],
                    channel="output", 
                    order=effect["order"],
                    parameters=effect["parameters"]
                )
                added_effect.set_enabled(effect["enabled"])
                logger.info("Added output effect: %s (order: %d, enabled: %s)",
                          effect["type"], effect["order"], effect["enabled"])
            except Exception as e:
                logger.error("Failed to add output effect %s: %s", effect["type"], e)
    
    @staticmethod
    def configure_effects_from_settings(effects_manager: AudioEffectsManager,
                                      settings: Dict[str, Any]) -> bool:
        """
        Configure effects manager from complete settings dictionary
        """
        try:
            effects_config = AudioEffectsConfig.parse_effects_from_config(settings)
            AudioEffectsConfig.apply_effects_to_manager(effects_manager, effects_config)
            logger.info("Successfully configured %d audio effects", len(effects_config))
            return True
        except Exception as e:
            logger.error("Failed to configure audio effects: %s", e)
            return False
    
    @staticmethod
    def validate_effect_config(effect_config: Dict[str, Any]) -> bool:
        """
        Validate a single effect configuration
        """
        required_fields = ["type", "channel"]
        
        for field in required_fields:
            if field not in effect_config:
                logger.error("Effect config missing required field: %s", field)
                return False
        
        if effect_config["channel"] not in ["input", "output"]:
            logger.error("Invalid channel: %s", effect_config["channel"])
            return False
        
        return True