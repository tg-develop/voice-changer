import os
import torch

from const import TMP_DIR, PTH_MERGED_FILENAME
from voice_changer.RVC.model_merger.MergeModel import merge_model
from voice_changer.utils.ModelMerger import ModelMerger, ModelMergerRequest
from settings import ServerSettings
import logging
logger = logging.getLogger(__name__)

class RVCModelMerger(ModelMerger):
    @classmethod
    def merge_models(cls, params: ServerSettings, request: ModelMergerRequest, store_slot: int) -> str:
        model = merge_model(params, request)

        # いったんは、アップロードフォルダに格納する。（歴史的経緯）
        # 後続のloadmodelを呼び出すことで永続化モデルフォルダに移動させられる。
        logger.info(f"store merged model to: {TMP_DIR}")
        os.makedirs(TMP_DIR, exist_ok=True)
        merged_file = os.path.join(TMP_DIR, PTH_MERGED_FILENAME)
        # Save as PTH for compatibility with other implementations
        torch.save(model, merged_file)
        return merged_file
