import os

import torch
from const import UPLOAD_DIR
from voice_changer.RVC.model_merger.MergeModel import merge_model
from voice_changer.utils.ModelMerger import ModelMerger, ModelMergerRequest
from settings import ServerSettings
import logging
logger = logging.getLogger(__name__)

class RVCModelMerger(ModelMerger):
    @classmethod
    def merge_models(cls, params: ServerSettings, request: ModelMergerRequest, storeSlot: int):
        merged = merge_model(params, request)

        # いったんは、アップロードフォルダに格納する。（歴史的経緯）
        # 後続のloadmodelを呼び出すことで永続化モデルフォルダに移動させられる。
        storeDir = os.path.join(UPLOAD_DIR)
        logger.info(f"store merged model to: {storeDir}")
        os.makedirs(storeDir, exist_ok=True)
        storeFile = os.path.join(storeDir, "merged.pth")
        torch.save(merged, storeFile)
        return storeFile
