import os
import logging
from typing import Dict, Any, Optional, TypedDict, Union, TYPE_CHECKING
from .PretrainList import pitch_extractors, embedders

if TYPE_CHECKING:
    from voice_changer.VoiceChangerSettings import VoiceChangerSettings

logger = logging.getLogger(__name__)

# Global reference to VoiceChangerSettings instance
voice_changer_settings = None

def set_voice_changer_settings(settings: 'VoiceChangerSettings') -> None:
    """Set the VoiceChangerSettings instance to be used for refreshing model info.
    
    This should be called during application startup.
    """
    global voice_changer_settings
    voice_changer_settings = settings

class ModelInfo(TypedDict):
    name: str
    type: str
    mandatory: bool
    downloaded: bool

class ModelManager:
    """Manages model information and download status for pretrained models."""
    
    @staticmethod
    def get_all_models() -> Dict[str, Dict[str, Any]]:
        """Get all models with their information and download status.
        
        Returns:
            Dictionary with model IDs as keys and model info as values.
        """
        all_models = {**pitch_extractors, **embedders}
        return ModelManager._add_download_status(all_models)
    
    @staticmethod
    def get_pitch_extractors() -> Dict[str, Dict[str, Any]]:
        """Get pitch extractor models with their information and download status.
        
        Returns:
            Dictionary with pitch extractor model IDs as keys and model info as values.
        """
        return ModelManager._add_download_status(dict(pitch_extractors))
    
    @staticmethod
    def get_embedders() -> Dict[str, Dict[str, Any]]:
        """Get embedder models with their information and download status.
        
        Returns:
            Dictionary with embedder model IDs as keys and model info as values.
        """
        return ModelManager._add_download_status(dict(embedders))
    
    @staticmethod
    def _add_download_status(models: Dict[str, Dict[str, Any]]) -> Dict[str, 'ModelInfo']:
        """Add download status to each model in the provided dictionary.
        
        Args:
            models: Dictionary of models to add download status to.
            
        Returns:
            Dictionary with model information containing only required fields.
            For DirectML edition, only includes mandatory ONNX models.
        """
        from settings import get_settings
        settings = get_settings()
        is_directml = settings.edition.lower() == 'directml'
        
        result = {}
        for model_id, model in models.items():
            # In DirectML mode, only include mandatory ONNX models
            if is_directml and not model['type'] == 'onnx':
                continue
                
            result[model_id] = {
                'name': model['name'],
                'type': model['type'],
                'mandatory': model['mandatory'],
                'downloaded': os.path.exists(model['saveTo'])
            }
        return result
    
    @staticmethod
    def _get_model_dict(model_key: str) -> tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """Get the model dictionary and model info by its key.
        
        Args:
            model_key: The key of the model to retrieve.
            
        Returns:
            A tuple of (model_dict, model_info) or (None, None) if not found.
        """
        # First try to find in pitch extractors
        if model_key in pitch_extractors:
            return pitch_extractors[model_key], 'pitch_extractor'
            
        # Then try to find in embedders
        if model_key in embedders:
            return embedders[model_key], 'embedder'
            
        return None, None
        
    @staticmethod
    def get_model(model_key: str) -> Optional[Dict[str, Any]]:
        """Get a specific model by its key.
        
        Args:
            model_key: The key of the model to retrieve.
            
        Returns:
            The model information with required fields, or None if not found.
        """
        model, model_type = ModelManager._get_model_dict(model_key)
        if not model:
            return None
            
        return {
            'name': model['name'],
            'type': model['type'],
            'mandatory': model.get('mandatory', False),
            'downloaded': os.path.exists(model['saveTo']),
            'path': model['saveTo'],
            'model_type': model_type
        }
        
    @staticmethod
    async def download_model(model_key: str) -> Dict[str, Any]:
        """Download a model by its key.
        
        Args:
            model_key: Key of the model to download
            
        Returns:
            Dictionary with status and message
        """
        model_dict, _ = ModelManager._get_model_dict(model_key)
        if not model_dict:
            raise ValueError(f"Model {model_key} not found")
            
        model_path = model_dict['saveTo']
        
        # Check if already downloaded and valid
        if os.path.exists(model_path):
            try:
                # Verify the file hash if available
                if 'hash' in model_dict:
                    with open(model_path, 'rb') as f:
                        from xxhash import xxh128
                        hasher = xxh128()
                        while True:
                            chunk = f.read(8192)
                            if not chunk:
                                break
                            hasher.update(chunk)
                        file_hash = hasher.hexdigest()
                        
                        if file_hash == model_dict['hash']:
                            return {
                                'status': 'success',
                                'message': f"Model {model_key} is already downloaded and valid",
                                'path': model_path
                            }
                else:
                    # If no hash is provided, assume the file is valid
                    return {
                        'status': 'success',
                        'message': f"Model {model_key} is already downloaded",
                        'path': model_path
                    }
            except Exception as e:
                logger.warning(f"Error verifying existing file {model_path}, will re-download: {e}")
                os.remove(model_path)
        
        # Download the file
        try:
            from .Downloader import download
            
            # Create the directory if it doesn't exist
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            
            # Prepare download parameters
            download_params = {
                'url': model_dict['url'],
                'saveTo': model_path
            }
            
            # Add hash if available for verification
            if 'hash' in model_dict:
                download_params['hash'] = model_dict['hash']
            
            # Start the download
            await download(download_params)
            
            # Verify the file was actually written and has the correct hash
            if not os.path.exists(model_path):
                raise RuntimeError(f"Download completed but file not found at {model_path}")
                
            # Verify the hash if available
            if 'hash' in model_dict:
                with open(model_path, 'rb') as f:
                    from xxhash import xxh128
                    hasher = xxh128()
                    while True:
                        chunk = f.read(8192)
                        if not chunk:
                            break
                        hasher.update(chunk)
                    file_hash = hasher.hexdigest()
                    
                    if file_hash != model_dict['hash']:
                        os.remove(model_path)  # Remove invalid download
                        raise RuntimeError(f"Downloaded file hash does not match expected hash for {model_key}")
            
            return {
                'status': 'success',
                'message': f"Successfully downloaded and verified {model_key}",
                'path': model_path
            }
        except Exception as e:
            logger.exception(f"Error downloading model {model_key}")
            raise
    
    @staticmethod
    def delete_model(model_key: str) -> Dict[str, Any]:
        """Delete a downloaded model.
        
        Args:
            model_key: Key of the model to delete
            
        Returns:
            Dictionary with status and message
        """
        model = ModelManager.get_model(model_key)
        if not model:
            raise ValueError(f"Model {model_key} not found")
            
        if model['mandatory']:
            raise ValueError(f"Cannot delete mandatory model: {model_key}")
            
        if not model['downloaded']:
            return {
                'status': 'success',
                'message': f"Model {model_key} was not found on disk",
                'path': model['path']
            }
            
        try:
            os.remove(model['path'])
            
            return {
                'status': 'success',
                'message': f"Successfully deleted {model_key}",
                'path': model['path']
            }
        except Exception as e:
            logger.exception(f"Error deleting model {model_key}")
            raise
