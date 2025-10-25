from const import UPLOAD_DIR
from data.ModelSlot import ModelSlots, loadAllSlotInfo, saveSlotInfo
from voice_changer.utils.ZipUtils import FileUtils
from typing import Optional
import json
import os
import shutil
import logging

logger = logging.getLogger(__name__)


class ModelSlotManager:
    _instance = None

    def __init__(self, model_dir: str):
        self.model_dir = model_dir
        self.modelSlots = loadAllSlotInfo(self.model_dir)
        self.file_utils = FileUtils()

    @classmethod
    def get_instance(cls, model_dir: str):
        if cls._instance is None:
            cls._instance = cls(model_dir)
        return cls._instance

    def _save_model_slot(self, slotIndex: int, slotInfo: ModelSlots):
        saveSlotInfo(self.model_dir, slotIndex, slotInfo)
        self.modelSlots = loadAllSlotInfo(self.model_dir)

    def _load_model_slot(self, slotIndex: int):
        return self.modelSlots[slotIndex]

    def getAllSlotInfo(self, reload: bool = False):
        if reload:
            self.modelSlots = loadAllSlotInfo(self.model_dir)
        return self.modelSlots

    def get_slot_info(self, slotIndex: int):
        if slotIndex == -1:
            return
        return self._load_model_slot(slotIndex)

    def save_model_slot(self, slotIndex: int, slotInfo: ModelSlots):
        self._save_model_slot(slotIndex, slotInfo)

    def update_model_info(self, slot_index: int, key: str, val):
        logger.info(f"UPDATE MODEL INFO: {key}={val}")
        slotInfo = self._load_model_slot(slot_index)
        if key == "speakers":
            setattr(slotInfo, key, json.loads(val))
        else:
            setattr(slotInfo, key, val)
        self._save_model_slot(slot_index, slotInfo)

    def _extract_zip_file(self, zip_path: str, extract_to: str) -> tuple[Optional[str], Optional[str]]:
        """Extract zip file and return paths to model and index files if found."""
        result = self.file_utils.extract_zip(
            zip_path=zip_path,
            extract_to=extract_to,
            allowed_model_extensions={'.pth', '.safetensors', '.onnx'},
            allowed_index_extensions={'.index'}
        )
        
        if not result['success']:
            logger.warning(f"Failed to extract ZIP file: {result.get('error')}")
            return None, None
            
        return result['model_file'], result['index_file']

    def store_model_assets(self, params: str):
        params_dict = json.loads(params)
        upload_path = os.path.join(UPLOAD_DIR, params_dict["file"])
        slot_index = params_dict["slot"]
        store_dir = os.path.join(self.model_dir, str(slot_index))
        
        # Ensure directory exists
        self.file_utils.ensure_directory(store_dir)
        
        slot_info = self._load_model_slot(slot_index)
        
        # Handle zip files
        if params_dict["file"].lower().endswith('.zip'):
            # Extract zip file
            model_file, index_file = self._extract_zip_file(upload_path, store_dir)
            
            # Update slot info with found files
            if model_file:
                if model_file.endswith('.onnx'):
                    slot_info.modelFileOnnx = model_file
                    slot_info.isONNX = True
                else:
                    slot_info.modelFile = model_file
                    slot_info.isONNX = False
            
            if index_file:
                slot_info.indexFile = index_file
            
            # Clean up the uploaded zip file after successful extraction
            try:
                os.remove(upload_path)
            except Exception as e:
                logger.warning(f"Failed to remove uploaded zip file {upload_path}: {e}")
        else:
            # Handle single file uploads
            file_extension = os.path.splitext(params_dict["file"])[1].lower()
            dest_path = os.path.join(store_dir, params_dict["file"])
            
            # Move the uploaded file to the model directory
            shutil.move(upload_path, dest_path)
            
            # Update slot info based on file type
            if file_extension == '.onnx':
                slot_info.modelFileOnnx = params_dict["file"]
                slot_info.isONNX = True
            elif file_extension == '.index':
                slot_info.indexFile = params_dict["file"]
            else:  # Assume it's a model file if not index or onnx
                slot_info.modelFile = params_dict["file"]
                slot_info.isONNX = False
        
        # Save the updated slot info
        self._save_model_slot(slot_index, slot_info)
        return slot_info
