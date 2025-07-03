import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from voice_changer.VoiceChangerManager import VoiceChangerManager

logger = logging.getLogger(__name__)


class MMVC_Rest_AudioEffects:
    def __init__(self, voiceChangerManager: VoiceChangerManager):
        self.voiceChangerManager = voiceChangerManager
        self.router = APIRouter()
        
        # Create a standalone AudioEffectsManager for schema/provider info
        # This is independent of any loaded model
        try:
            from voice_changer.audio_effects.AudioEffectsManager import AudioEffectsManager
            self.standalone_effects_manager = AudioEffectsManager()
            logger.info("Standalone AudioEffectsManager created successfully")
        except Exception as e:
            logger.error(f"Failed to create standalone AudioEffectsManager: {e}")
            self.standalone_effects_manager = None
        
        self._add_routes()

    def _add_routes(self):
        self.router.add_api_route("/api/audio-effects/schema", self.get_effects_schema, methods=["GET"])
        self.router.add_api_route("/api/audio-effects/providers", self.get_providers_info, methods=["GET"])

    def get_effects_schema(self) -> Dict[str, Any]:
        """
        Get all supported audio effects with their parameter schemas
        """
        try:
            if self.standalone_effects_manager is None:
                logger.warning("AudioEffectsManager not available")
                return {}
            return self.standalone_effects_manager.get_supported_effects()
        except Exception as e:
            logger.error(f"Error getting effects schema: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get effects schema: {str(e)}")

    def get_providers_info(self) -> Dict[str, Any]:
        """
        Get information about all registered audio effect providers
        """
        try:
            if self.standalone_effects_manager is None:
                logger.warning("AudioEffectsManager not available")
                return {"providers": [], "total_effects": 0}
            return {
                "providers": self.standalone_effects_manager.get_providers_info(),
                "total_effects": len(self.standalone_effects_manager.get_supported_effects())
            }
        except Exception as e:
            logger.error(f"Error getting providers info: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get providers info: {str(e)}")