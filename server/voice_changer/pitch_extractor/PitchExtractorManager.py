from typing import Protocol
from const import PitchExtractorType
from voice_changer.pitch_extractor.CrepeOnnxPitchExtractor import CrepeOnnxPitchExtractor
from voice_changer.pitch_extractor.CrepePitchExtractor import CrepePitchExtractor
from voice_changer.pitch_extractor.PitchExtractor import PitchExtractor
from voice_changer.pitch_extractor.RMVPEOnnxPitchExtractor import RMVPEOnnxPitchExtractor
from voice_changer.pitch_extractor.RMVPEPitchExtractor import RMVPEPitchExtractor
from voice_changer.pitch_extractor.FcpePitchExtractor import FcpePitchExtractor
from voice_changer.pitch_extractor.FcpeOnnxPitchExtractor import FcpeOnnxPitchExtractor
from downloader.PretrainList import pitch_extractors
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
        
        # Map of pitch extractors to their implementations using paths from PretrainList.py
        PITCH_EXTRACTOR_MAP = {
            'crepe_tiny': {
                'class': CrepePitchExtractor,
                'path': pitch_extractors['crepe_tiny']['saveTo'],
                'args': ['crepe_tiny', pitch_extractors['crepe_tiny']['saveTo']]
            },
            'crepe_full': {
                'class': CrepePitchExtractor,
                'path': pitch_extractors['crepe_full']['saveTo'],
                'args': ['crepe_full', pitch_extractors['crepe_full']['saveTo']]
            },
            'crepe_tiny_onnx': {
                'class': CrepeOnnxPitchExtractor,
                'path': pitch_extractors['crepe_tiny_onnx']['saveTo'],
                'args': ['crepe_tiny_onnx', pitch_extractors['crepe_tiny_onnx']['saveTo']]
            },
            'crepe_full_onnx': {
                'class': CrepeOnnxPitchExtractor,
                'path': pitch_extractors['crepe_full_onnx']['saveTo'],
                'args': ['crepe_full_onnx', pitch_extractors['crepe_full_onnx']['saveTo']]
            },
            'rmvpe': {
                'class': RMVPEPitchExtractor,
                'path': pitch_extractors['rmvpe']['saveTo'],
                'args': [pitch_extractors['rmvpe']['saveTo']]
            },
            'rmvpe_onnx': {
                'class': RMVPEOnnxPitchExtractor,
                'path': pitch_extractors['rmvpe_onnx']['saveTo'],
                'args': [pitch_extractors['rmvpe_onnx']['saveTo']]
            },
            'fcpe': {
                'class': FcpePitchExtractor,
                'path': pitch_extractors['fcpe']['saveTo'],
                'args': [pitch_extractors['fcpe']['saveTo']]
            },
            'fcpe_onnx': {
                'class': FcpeOnnxPitchExtractor,
                'path': pitch_extractors['fcpe_onnx']['saveTo'],
                'args': [pitch_extractors['fcpe_onnx']['saveTo']]
            },
        }
        
        import os
        
        # Check if the requested extractor exists and has a valid model file
        extractor_info = PITCH_EXTRACTOR_MAP.get(pitch_extractor)
        if extractor_info and os.path.exists(extractor_info['path']):
            try:
                return extractor_info['class'](*extractor_info['args'])
            except Exception as e:
                logger.warning(f"Failed to load {pitch_extractor}: {str(e)}")
        elif extractor_info:
            logger.warning(f"Model file not found for {pitch_extractor} at {extractor_info['path']}")
        else:
            logger.warning(f"PitchExtractor {pitch_extractor} not found")
        
        # Fall back to RMVPE ONNX
        logger.warning("Falling back to RMVPE ONNX")
        return RMVPEOnnxPitchExtractor(pitch_extractors['rmvpe_onnx']['saveTo'])
