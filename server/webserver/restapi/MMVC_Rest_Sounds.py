import json
import logging
from fastapi import APIRouter, Form
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from voice_changer.VoiceChangerManager import VoiceChangerManager
from voice_changer.utils.LoadSoundParams import LoadSoundParamFile, LoadSoundParams

logger = logging.getLogger(__name__)


class MMVC_Rest_Sounds:
    def __init__(self, voiceChangerManager: VoiceChangerManager):
        self.voiceChangerManager = voiceChangerManager
        self.router = APIRouter()
        self.router.add_api_route("/load_sound", self.post_load_sound_file, methods=["POST"])
        self.router.add_api_route("/delete_sound", self.post_delete_sound_file, methods=["POST"])
        self.router.add_api_route("/update_sound_info", self.post_update_sound_info, methods=["POST"])

    # Updates the configuration of a SoundSlot
    def post_update_sound_info(self, soundId: str = Form(...), key: str = Form(...), val: str = Form(...)):
        try:
            info = self.voiceChangerManager.update_sound_info(soundId, key, val)
            return JSONResponse(content=jsonable_encoder(info))
        except Exception as e:
            logger.exception(e)

    def post_delete_sound_file(self, soundId: str = Form(...)):
        try:
            info = self.voiceChangerManager.delete_sound(soundId)
            return JSONResponse(content=jsonable_encoder(info))
        except Exception as e:
            logger.exception(e)

    # Moves a SoundFile from upload_dir to sound_dir and creates a SoundSlot
    async def post_load_sound_file(
        self,
        params: str = Form(...),
    ):
        try:
            paramDict = json.loads(params)
            logger.info(f"paramDict", paramDict)
            loadSoundParams = LoadSoundParams(**paramDict)

            info = await self.voiceChangerManager.load_sound(loadSoundParams)
            json_compatible_item_data = jsonable_encoder(info)
            return JSONResponse(content=json_compatible_item_data)
        except Exception as e:
            logger.exception(e)