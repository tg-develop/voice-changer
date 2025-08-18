from typing import Protocol
from const import PitchExtractorType
from voice_changer.pitch_extractor.CrepeOnnxPitchExtractor import CrepeOnnxPitchExtractor
from voice_changer.pitch_extractor.CrepePitchExtractor import CrepePitchExtractor
from voice_changer.pitch_extractor.PitchExtractor import PitchExtractor
from voice_changer.pitch_extractor.RMVPEOnnxPitchExtractor import RMVPEOnnxPitchExtractor
from voice_changer.pitch_extractor.RMVPEPitchExtractor import RMVPEPitchExtractor
from voice_changer.pitch_extractor.FcpePitchExtractor import FcpePitchExtractor
from voice_changer.pitch_extractor.FcpeOnnxPitchExtractor import FcpeOnnxPitchExtractor
from settings import ServerSettings, get_settings
import logging
logger = logging.getLogger(__name__)

class PitchExtractorManager(Protocol):
    pitch_extractor: PitchExtractor | None = None
    params: ServerSettings

    @classmethod
    def initialize(cls):
        cls.params = get_settings()

    @classmethod
    def getPitchExtractor(cls, pitch_extractor: PitchExtractorType, force_reload: bool) -> PitchExtractor:
        cls.pitch_extractor = cls.loadPitchExtractor(pitch_extractor, force_reload)
        return cls.pitch_extractor

    @classmethod
    def loadPitchExtractor(cls, pitch_extractor: PitchExtractorType, force_reload: bool) -> PitchExtractor:
        if cls.pitch_extractor is not None \
            and pitch_extractor == cls.pitch_extractor.type \
            and not force_reload:
            logger.info('Reusing pitch extractor.')
            return cls.pitch_extractor

        logger.info(f'Loading pitch extractor {pitch_extractor}')
        try:
            PITCH_EXTRACTOR_MAP = {
                'crepe_tiny': lambda cls: CrepePitchExtractor('crepe_tiny', cls.params.crepe_tiny),
                'crepe_full': lambda cls: CrepePitchExtractor('crepe_full', cls.params.crepe_full),
                'crepe_tiny_onnx': lambda cls: CrepeOnnxPitchExtractor('crepe_tiny_onnx', cls.params.crepe_onnx_tiny),
                'crepe_full_onnx': lambda cls: CrepeOnnxPitchExtractor('crepe_full_onnx', cls.params.crepe_onnx_full),
                'rmvpe': lambda cls: RMVPEPitchExtractor(cls.params.rmvpe),
                'rmvpe_onnx': lambda cls: RMVPEOnnxPitchExtractor(cls.params.rmvpe_onnx),
                'fcpe': lambda cls: FcpePitchExtractor(cls.params.fcpe),
                'fcpe_onnx': lambda cls: FcpeOnnxPitchExtractor(cls.params.fcpe_onnx),
            }
            extractor = PITCH_EXTRACTOR_MAP.get(pitch_extractor)
            if extractor:
                return extractor(cls)
            else:
                logger.warning(f"PitchExtractor not found {pitch_extractor}. Fallback to rmvpe_onnx")
                return RMVPEOnnxPitchExtractor(cls.params.rmvpe_onnx)
        except RuntimeError as e:
            logger.error(f'Failed to load {pitch_extractor}. Fallback to rmvpe_onnx.')
            logger.exception(e)
            return RMVPEOnnxPitchExtractor(cls.params.rmvpe_onnx)
