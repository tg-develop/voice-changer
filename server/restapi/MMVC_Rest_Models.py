import json
from fastapi import APIRouter
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from fastapi import Form
from voice_changer.VoiceChangerManager import VoiceChangerManager
from voice_changer.utils.LoadModelParams import LoadModelParamFile, LoadModelParams
import logging

logger = logging.getLogger(__name__)

class MMVC_Rest_Models:
    def __init__(self, voiceChangerManager: VoiceChangerManager):
        self.voiceChangerManager = voiceChangerManager
        self.router = APIRouter()
        self.router.add_api_route("/load_model", self.post_load_model, methods=["POST"]) # Get Model after upload
        self.router.add_api_route("/onnx", self.get_onnx, methods=["GET"])
        self.router.add_api_route("/merge_model", self.post_merge_models, methods=["POST"])
        self.router.add_api_route("/update_model_default", self.post_update_model_default, methods=["POST"]) # Save Settings Button
        self.router.add_api_route("/update_model_info", self.post_update_model_info, methods=["POST"])
        self.router.add_api_route("/upload_model_assets", self.post_upload_model_assets, methods=["POST"])

    async def post_load_model(
        self,
        slot: int = Form(...),
        isHalf: bool = Form(...),
        params: str = Form(...),
    ):
        try:
            paramDict = json.loads(params)
            logger.info(f"paramDict", paramDict)
            loadModelparams = LoadModelParams(**paramDict)
            loadModelparams.files = [LoadModelParamFile(**x) for x in paramDict["files"]]
            # logger.info(f"paramDict", loadModelparams)

            info = await self.voiceChangerManager.load_model(loadModelparams)
            json_compatible_item_data = jsonable_encoder(info)
            return JSONResponse(content=json_compatible_item_data)
        except Exception as e:
            logger.exception(e)

    def get_onnx(self):
        try:
            info = self.voiceChangerManager.export2onnx()
            json_compatible_item_data = jsonable_encoder(info)
            return JSONResponse(content=json_compatible_item_data)
        except Exception as e:
            logger.exception(e)

    async def post_merge_models(self, request: str = Form(...)):
        try:
            logger.info(request)
            info = await self.voiceChangerManager.merge_models(request)
            json_compatible_item_data = jsonable_encoder(info)
            return JSONResponse(content=json_compatible_item_data)
        except Exception as e:
            logger.exception(e)

    def post_update_model_default(self):
        try:
            info = self.voiceChangerManager.update_model_default()
            json_compatible_item_data = jsonable_encoder(info)
            return JSONResponse(content=json_compatible_item_data)
        except Exception as e:
            logger.exception(e)

    def post_update_model_info(self, newData: str = Form(...)):
        try:
            info = self.voiceChangerManager.update_model_info(newData)
            json_compatible_item_data = jsonable_encoder(info)
            return JSONResponse(content=json_compatible_item_data)
        except Exception as e:
            logger.exception(e)

    def post_upload_model_assets(self, params: str = Form(...)):
        try:
            info = self.voiceChangerManager.upload_model_assets(params)
            json_compatible_item_data = jsonable_encoder(info)
            return JSONResponse(content=json_compatible_item_data)
        except Exception as e:
            logger.exception(e)