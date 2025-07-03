import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from voice_changer.VoiceChangerManager import VoiceChangerManager

logger = logging.getLogger(__name__)


class MMVC_Rest_AudioEffects:
    def __init__(self, voiceChangerManager: VoiceChangerManager):
        self.voiceChangerManager = voiceChangerManager
        self.router = APIRouter()
        self._add_routes()

    def _add_routes(self):
        self.router.add_api_route("/api/audio-effects/schema", self.get_effects_schema, methods=["GET"])
        self.router.add_api_route("/api/audio-effects/providers", self.get_providers_info, methods=["GET"])

    def get_effects_schema(self) -> Dict[str, Any]:
        """
        Get all supported audio effects with their parameter schemas
        """
        try:
            voice_changer = self.voiceChangerManager.get_voice_changer()
            if not voice_changer:
                raise HTTPException(status_code=500, detail="Voice changer not initialized")
            
            # Check if voice changer has audio effects manager
            if hasattr(voice_changer, 'audio_effects_manager'):
                effects_manager = voice_changer.audio_effects_manager
                return effects_manager.get_supported_effects()
            else:
                # Return empty schema if audio effects not available
                logger.warning("Audio effects manager not available in voice changer")
                return {}
        
        except Exception as e:
            logger.error(f"Error getting effects schema: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get effects schema: {str(e)}")

    def get_providers_info(self) -> Dict[str, Any]:
        """
        Get information about all registered audio effect providers
        """
        try:
            voice_changer = self.voiceChangerManager.get_voice_changer()
            if not voice_changer:
                raise HTTPException(status_code=500, detail="Voice changer not initialized")
            
            # Check if voice changer has audio effects manager
            if hasattr(voice_changer, 'audio_effects_manager'):
                effects_manager = voice_changer.audio_effects_manager
                return {
                    "providers": effects_manager.get_providers_info(),
                    "total_effects": len(effects_manager.get_supported_effects())
                }
            else:
                logger.warning("Audio effects manager not available in voice changer")
                return {"providers": [], "total_effects": 0}
        
        except Exception as e:
            logger.error(f"Error getting providers info: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get providers info: {str(e)}")