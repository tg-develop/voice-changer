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
        
        # Map of pitch extractors to their implementations
        PITCH_EXTRACTOR_MAP = {
            'crepe_tiny': {
                'class': CrepePitchExtractor,
                'path': cls.params.crepe_tiny,
                'args': ['crepe_tiny', cls.params.crepe_tiny]
            },
            'crepe_full': {
                'class': CrepePitchExtractor,
                'path': cls.params.crepe_full,
                'args': ['crepe_full', cls.params.crepe_full]
            },
            'crepe_tiny_onnx': {
                'class': CrepeOnnxPitchExtractor,
                'path': cls.params.crepe_onnx_tiny,
                'args': ['crepe_tiny_onnx', cls.params.crepe_onnx_tiny]
            },
            'crepe_full_onnx': {
                'class': CrepeOnnxPitchExtractor,
                'path': cls.params.crepe_onnx_full,
                'args': ['crepe_full_onnx', cls.params.crepe_onnx_full]
            },
            'rmvpe': {
                'class': RMVPEPitchExtractor,
                'path': cls.params.rmvpe,
                'args': [cls.params.rmvpe]
            },
            'rmvpe_onnx': {
                'class': RMVPEOnnxPitchExtractor,
                'path': cls.params.rmvpe_onnx,
                'args': [cls.params.rmvpe_onnx]
            },
            'fcpe': {
                'class': FcpePitchExtractor,
                'path': cls.params.fcpe,
                'args': [cls.params.fcpe]
            },
            'fcpe_onnx': {
                'class': FcpeOnnxPitchExtractor,
                'path': cls.params.fcpe_onnx,
                'args': [cls.params.fcpe_onnx]
            },
        }
        
        try:
            # Check if the requested extractor exists
            extractor_info = PITCH_EXTRACTOR_MAP.get(pitch_extractor)
            if not extractor_info:
                logger.warning(f"PitchExtractor {pitch_extractor} not found. Falling back to rmvpe_onnx")
                return RMVPEOnnxPitchExtractor(cls.params.rmvpe_onnx)
            
            # Check if the model file exists
            import os
            if not os.path.exists(extractor_info['path']):
                logger.warning(f"Model file not found for {pitch_extractor} at {extractor_info['path']}")
                
                # If this is a non-ONNX FCPE model and the ONNX version exists, suggest using that
                if pitch_extractor == 'fcpe' and os.path.exists(cls.params.fcpe_onnx):
                    logger.info("Falling back to FCPE ONNX version")
                    return FcpeOnnxPitchExtractor(cls.params.fcpe_onnx)
                
                # If FCPE is not available, fall back to RMVPE ONNX
                if pitch_extractor.startswith('fcpe'):
                    logger.warning("Falling back to RMVPE ONNX")
                    return RMVPEOnnxPitchExtractor(cls.params.rmvpe_onnx)
                
                # For other models, just use the fallback
                return RMVPEOnnxPitchExtractor(cls.params.rmvpe_onnx)
            
            # If we got here, the file exists, try to load it
            extractor_class = extractor_info['class']
            return extractor_class(*extractor_info['args'])
            
        except Exception as e:
            logger.error(f'Failed to load {pitch_extractor}. Error: {str(e)}')
            logger.exception('PitchExtractor loading error')
            
            # Fallback to RMVPE ONNX if available
            if os.path.exists(cls.params.rmvpe_onnx):
                logger.warning('Falling back to RMVPE ONNX')
                return RMVPEOnnxPitchExtractor(cls.params.rmvpe_onnx)
            
            # If RMVPE ONNX is not available, try any available extractor
            for name, info in PITCH_EXTRACTOR_MAP.items():
                if name != pitch_extractor and os.path.exists(info['path']):
                    try:
                        logger.warning(f'Falling back to {name}')
                        return info['class'](*info['args'])
                    except Exception as e2:
                        logger.error(f'Failed to load fallback extractor {name}: {str(e2)}')
                        continue
            
            # If we get here, no extractor could be loaded
            raise RuntimeError(f'Failed to load any pitch extractor. Original error: {str(e)}')
