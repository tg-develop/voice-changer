import os
import sys
import faiss
import faiss.contrib.torch_utils
import torch
from data.ModelSlot import RVCModelSlot

from voice_changer.common.deviceManager.DeviceManager import DeviceManager
from voice_changer.embedder.EmbedderManager import EmbedderManager
from voice_changer.RVC.inferencer.InferencerManager import InferencerManager
from voice_changer.RVC.pipeline.Pipeline import Pipeline
from voice_changer.pitch_extractor.PitchExtractorManager import PitchExtractorManager
from settings import get_settings

import logging
logger = logging.getLogger(__name__)

def createPipeline(modelSlot: RVCModelSlot, f0Detector: str, useONNX: bool, force_reload: bool):
    model_dir = get_settings().model_dir
    # Inferencer 生成
    if useONNX:
        modelPath = os.path.join(model_dir, str(modelSlot.slotIndex), os.path.basename(modelSlot.modelFileOnnx))
        inferencer = InferencerManager.getInferencer(modelSlot.modelTypeOnnx, modelPath)
    else:
        modelPath = os.path.join(model_dir, str(modelSlot.slotIndex), os.path.basename(modelSlot.modelFile))
        inferencer = InferencerManager.getInferencer(modelSlot.modelType, modelPath)

    # Embedder 生成
    embedder = EmbedderManager.get_embedder(modelSlot.embedder, force_reload)

    # pitchExtractor
    pitchExtractor = PitchExtractorManager.getPitchExtractor(f0Detector, force_reload)

    # index, feature
    indexPath = os.path.join(model_dir, str(modelSlot.slotIndex), os.path.basename(modelSlot.indexFile))
    index, index_reconstruct = _loadIndex(indexPath)

    pipeline = Pipeline(
        embedder,
        inferencer,
        pitchExtractor,
        index,
        index_reconstruct,
        modelSlot.f0,
        modelSlot.samplingRate,
        modelSlot.embChannels,
    )

    return pipeline


def _loadIndex(indexPath: str) -> tuple[faiss.Index | None, torch.Tensor | None]:
    dev = DeviceManager.get_instance().device
    # Indexのロード
    logger.info("Loading index...")
    # ファイル指定があってもファイルがない場合はNone
    if os.path.exists(indexPath) is not True or os.path.isfile(indexPath) is not True:
        logger.warning("Index file not found. Index will not be used.")
        return (None, None)

    logger.info(f"Try loading \"{indexPath}\"...")
    try:
        index: faiss.IndexIVFFlat = faiss.read_index(indexPath)
        if not index.is_trained:
            logger.error("Invalid index. You MUST use added_xxxx.index, not trained_xxxx.index. Index will not be used.")
            return (None, None)
        if index.ntotal == 0:
            logger.error("Index is empty. Index will not be used.")
            return (None, None)
        # BUG: faiss-gpu does not support reconstruct on GPU indices
        # https://github.com/facebookresearch/faiss/issues/2181
        index_reconstruct = index.reconstruct_n(0, index.ntotal).to(dev)
        if sys.platform == 'linux' and '+cu' in torch.__version__ and dev.type == 'cuda':
            index: faiss.GpuIndexIVFFlat = faiss.index_cpu_to_gpus_list(index, gpus=[dev.index])
    except Exception as e: # NOQA
        logger.error("Load index failed. Index will not be used.")
        logger.exception(e)
        return (None, None)

    return index, index_reconstruct
