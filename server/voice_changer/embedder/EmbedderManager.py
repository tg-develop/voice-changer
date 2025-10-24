from const import EmbedderType
from voice_changer.embedder.Embedder import Embedder
from voice_changer.embedder.OnnxEmbedder import OnnxEmbedder
from downloader.PretrainList import embedders
import logging
import os

logger = logging.getLogger(__name__)

class EmbedderManager:
    embedder: Embedder | None = None

    @classmethod
    def initialize(cls):
        # No initialization needed as we're using PretrainList directly
        pass

    @classmethod
    def get_embedder(cls, embedder_type: EmbedderType, force_reload: bool = False) -> Embedder:
        if cls.embedder is not None \
            and cls.embedder == embedder_type \
            and not force_reload:
            logger.info('Reusing embedder.')
            return cls.embedder
        cls.embedder = cls.load_embedder(embedder_type)
        return cls.embedder

    @classmethod
    def load_embedder(cls, embedder_type: EmbedderType) -> Embedder:
        logger.info(f'Loading embedder {embedder_type}')

        # Map embedder_type to the key used in PretrainList
        embedder_key = {
            'hubert_base': 'hubert_base',
            'contentvec': 'hubert_base',
            'spin_base': 'spin_base',
            'spin_v2': 'spin_v2'
        }.get(embedder_type)

        if not embedder_key or embedder_key not in embedders:
            raise RuntimeError(f'Unsupported embedder type: {embedder_type}')

        embedder_info = embedders[embedder_key]
        model_path = embedder_info['saveTo']

        if not os.path.exists(model_path):
            raise FileNotFoundError(f'Embedder model file not found at {model_path}. Please download it first.')

        return OnnxEmbedder().load_model(model_path)

