import os
import shutil
from const import EnumInferenceTypes
from dataclasses import asdict
import torch
import onnxruntime
import json
import safetensors

from data.ModelSlot import RVCModelSlot
from voice_changer.common.SafetensorsUtils import convert_single
from voice_changer.utils.LoadModelParams import LoadModelParams
from voice_changer.utils.ModelSlotGenerator import ModelSlotGenerator
from voice_changer.utils.ZipUtils import FileUtils
from settings import get_settings
import logging
logger = logging.getLogger(__name__)

class RVCModelSlotGenerator(ModelSlotGenerator):
    def __init__(self):
        self.file_utils = FileUtils()

    @classmethod
    def load_model(cls, props: LoadModelParams):
        model_dir = get_settings().model_dir
        slot_dir = os.path.join(model_dir, str(props.slot))
        
        slotInfo: RVCModelSlot = RVCModelSlot()
        
        # If no files are provided, this might be a delete operation
        if not props.files or len(props.files) == 0:
            logger.info(f"No files provided in load_model, this might be a delete operation for slot {props.slot}")
            return None
            
        model_zip_path = None
        model_path = None
        model_found = False
        
        # First pass: look for model files
        for file in props.files:
            if file.kind == "rvcModel":
                slotInfo.modelFile = file.name
                model_path = os.path.join(slot_dir, file.name)
                model_found = True
                if file.name.lower().endswith('.zip'):
                    model_zip_path = model_path
                break
                
        # Handle index file
        for file in props.files:
            if file.kind == "rvcIndex":
                slotInfo.indexFile = file.name
                break
                
        slotInfo.defaultTune = 0
        slotInfo.defaultFormantShift = 0
        slotInfo.defaultIndexRatio = 0
        slotInfo.defaultProtect = 0.5
        
        # Procedure for zip files
        model_path_to_use = model_path
        if model_zip_path and os.path.exists(model_zip_path) and model_zip_path.lower().endswith('.zip'):
            logger.info(f"Extracting model from ZIP file: {model_zip_path}")
            
            # Ensure the target directory exists
            os.makedirs(slot_dir, exist_ok=True)
            
            # Extract the ZIP file
            result = FileUtils().extract_zip(
                zip_path=model_zip_path,
                extract_to=slot_dir,
                allowed_model_extensions={'.pth', '.pt', '.safetensors', '.onnx'},
                allowed_index_extensions={'.index'}
            )
            
            if not result['success']:
                logger.error(f"Failed to extract ZIP file: {result.get('error')}")
                # Clean up the model directory if it was created
                if os.path.exists(slot_dir):
                    shutil.rmtree(slot_dir, ignore_errors=True)
                return None
                
            # Update file references and rename model file if needed
            if result['model_file']:
                original_model_path = os.path.join(slot_dir, result['model_file'])
                
                # Get the original extension and base name
                original_ext = os.path.splitext(result['model_file'])[1]
                zip_basename = os.path.splitext(os.path.basename(model_zip_path))[0]
                new_model_filename = f"{zip_basename}{original_ext}"
                new_model_path = os.path.join(slot_dir, new_model_filename)
                
                # Rename the file if it doesn't match the ZIP name
                if original_model_path != new_model_path:
                    try:
                        os.rename(original_model_path, new_model_path)
                        logger.info(f"Renamed model file to: {new_model_filename}")
                    except Exception as e:
                        logger.warning(f"Could not rename model file: {str(e)}")
                        new_model_filename = result['model_file']
                        new_model_path = original_model_path
                
                slotInfo.modelFile = new_model_filename
                model_path_to_use = new_model_path
                logger.info(f"Using model file: {new_model_filename}")
                
            if result['index_file']:
                slotInfo.indexFile = result['index_file']
                logger.info(f"Found index file: {result['index_file']}")
                
            # Clean up the ZIP file after successful extraction
            try:
                os.remove(model_zip_path)
            except Exception as e:
                logger.warning(f"Failed to remove ZIP file {model_zip_path}: {str(e)}")
        
        # If we didn't find a model file in the first pass, check if we have a zip file
        if not model_found and model_zip_path is None:
            for file in props.files:
                if file.name.lower().endswith('.zip'):
                    model_zip_path = os.path.join(slot_dir, file.name)
                    break
                    
        # If we have a zip file but no model file yet, try to extract it
        if model_zip_path and not model_found:
            logger.info(f"No explicit model file found, but found zip file: {model_zip_path}")
            result = FileUtils().extract_zip(
                zip_path=model_zip_path,
                extract_to=slot_dir,
                allowed_model_extensions={'.pth', '.pt', '.safetensors', '.onnx'},
                allowed_index_extensions={'.index'}
            )
            
            if result['success']:
                if result['model_file']:
                    slotInfo.modelFile = result['model_file']
                    model_path = os.path.join(slot_dir, result['model_file'])
                    model_found = True
                    logger.info(f"Found model file in zip: {result['model_file']}")
                
                if result['index_file']:
                    slotInfo.indexFile = result['index_file']
                    logger.info(f"Found index file in zip: {result['index_file']}")
        
        # Final validation
        if not model_found or not slotInfo.modelFile or not os.path.exists(os.path.join(slot_dir, slotInfo.modelFile)):
            error_msg = f"No valid model file found in the provided files or zip archive. Checked path: {model_path}"
            logger.error(error_msg)
            return None
            
        logger.info(f"Using model file: {model_path_to_use}")
        
        try:
            # Set model type and name
            slotInfo.isONNX = slotInfo.modelFile.lower().endswith(".onnx")
            slotInfo.name = os.path.splitext(os.path.basename(slotInfo.modelFile))[0]
            logger.info(f"RVC:: slotInfo.modelFile {slotInfo.modelFile}")

            # Load model info
            if slotInfo.isONNX:
                slotInfo = cls._setInfoByONNX(model_path_to_use, slotInfo)
            else:
                slotInfo = cls._setInfoByPytorch(model_path_to_use, slotInfo)
                if model_path_to_use and not model_path_to_use.endswith(".safetensors"):
                    convert_single(model_path_to_use, True)
                    filename, _ = os.path.splitext(os.path.basename(model_path_to_use))
                    slotInfo.modelFile = f'{filename}.safetensors'
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise

        # Manually set embedder to SPIN, because it's not in the metadata
        if props.embedder == "spin_base":
            slotInfo.embedder = "spin_base"
            slotInfo.embOutputLayer = 12
            slotInfo.embChannels = 768
            slotInfo.useFinalProj = False
        
        return slotInfo

    @classmethod
    def _setInfoByPytorch(cls, modelPath: str, slot: RVCModelSlot):
        if modelPath.endswith(".safetensors"):
            with safetensors.safe_open(modelPath, 'pt') as data:
                cpt = data.metadata()
                cpt['f0'] = int(cpt['f0'])
                cpt['config'] = json.loads(cpt['config'])
        else:
            cpt = torch.load(modelPath, map_location="cpu")
        config_len = len(cpt["config"])
        version = cpt.get("version", "v1")

        slot = RVCModelSlot(**asdict(slot))
        slot.f0 = True if cpt["f0"] == 1 else False

        if config_len == 18:
            # Original RVC
            if version == "v1":
                slot.modelType = EnumInferenceTypes.pyTorchRVC.value if slot.f0 else EnumInferenceTypes.pyTorchRVCNono.value
                slot.embChannels = 256
                slot.embOutputLayer = 9
                slot.useFinalProj = True
                slot.embedder = "hubert_base"
                logger.info("Official Model(pyTorch) : v1")
            else:
                slot.modelType = EnumInferenceTypes.pyTorchRVCv2.value if slot.f0 else EnumInferenceTypes.pyTorchRVCv2Nono.value
                slot.embChannels = 768
                slot.embOutputLayer = 12
                slot.useFinalProj = False
                slot.embedder = "hubert_base"
                logger.info("Official Model(pyTorch) : v2")

        else:
            # DDPN RVC
            slot.f0 = True if cpt["f0"] == 1 else False
            slot.modelType = EnumInferenceTypes.pyTorchWebUI.value if slot.f0 else EnumInferenceTypes.pyTorchWebUINono.value
            slot.embChannels = cpt["config"][17]
            slot.embOutputLayer = cpt["embedder_output_layer"] if "embedder_output_layer" in cpt else 9
            if slot.embChannels == 256:
                slot.useFinalProj = True
            else:
                slot.useFinalProj = False

            # DDPNモデルの情報を表示
            if slot.embChannels == 256 and slot.embOutputLayer == 9 and slot.useFinalProj:
                logger.info("DDPN Model(pyTorch) : Official v1 like")
            elif slot.embChannels == 768 and slot.embOutputLayer == 12 and slot.useFinalProj is False:
                logger.info("DDPN Model(pyTorch): Official v2 like")
            else:
                logger.info(f"DDPN Model(pyTorch): ch:{slot.embChannels}, L:{slot.embOutputLayer}, FP:{slot.useFinalProj}")

            slot.embedder = cpt["embedder_name"]
            if slot.embedder.endswith("768"):
                slot.embedder = slot.embedder[:-3]

            if "speaker_info" in cpt.keys():
                for k, v in cpt["speaker_info"].items():
                    slot.speakers[int(k)] = str(v)

        slot.samplingRate = cpt["config"][-1]

        del cpt

        return slot

    @classmethod
    def _setInfoByONNX(cls, modelPath: str, slot: RVCModelSlot):
        tmp_onnx_session = onnxruntime.InferenceSession(modelPath, providers=["CPUExecutionProvider"])
        modelmeta = tmp_onnx_session.get_modelmeta()
        try:
            slot = RVCModelSlot(**asdict(slot))
            metadata = json.loads(modelmeta.custom_metadata_map["metadata"])

            # slot.modelType = metadata["modelType"]
            slot.embChannels = metadata["embChannels"]

            slot.embOutputLayer = metadata["embOutputLayer"] if "embOutputLayer" in metadata else 9
            slot.useFinalProj = metadata["useFinalProj"] if "useFinalProj" in metadata else True if slot.embChannels == 256 else False

            if slot.embChannels == 256:
                slot.useFinalProj = True
            else:
                slot.useFinalProj = False

            # ONNXモデルの情報を表示
            if slot.embChannels == 256 and slot.embOutputLayer == 9 and slot.useFinalProj:
                logger.info("ONNX Model: Official v1 like")
            elif slot.embChannels == 768 and slot.embOutputLayer == 12 and slot.useFinalProj is False:
                logger.info("ONNX Model: Official v2 like")
            else:
                logger.info(f"ONNX Model: ch:{slot.embChannels}, L:{slot.embOutputLayer}, FP:{slot.useFinalProj}")

            if "embedder" not in metadata:
                slot.embedder = "hubert_base"
            else:
                slot.embedder = metadata["embedder"]

            slot.f0 = metadata["f0"]
            slot.modelType = EnumInferenceTypes.onnxRVC.value if slot.f0 else EnumInferenceTypes.onnxRVCNono.value
            slot.samplingRate = metadata["samplingRate"]
            slot.deprecated = False

            if slot.embChannels == 256:
                if metadata["version"] == "2.1":
                    slot.version = "v1.1"  # 1.1はclipをonnx内部で実施. realtimeをdisable
                else:
                    slot.version = "v1"
            elif metadata["version"] == "2":
                slot.version = "v2"
            elif metadata["version"] == "2.1":  # 2.1はclipをonnx内部で実施. realtimeをdisable
                slot.version = "v2.1"
            elif metadata["version"] == "2.2":  # 2.1と同じ
                slot.version = "v2.2"
        except Exception as e:
            slot.modelType = EnumInferenceTypes.onnxRVC.value
            slot.embChannels = 256
            slot.embedder = "hubert_base"
            slot.f0 = True
            slot.samplingRate = 48000
            slot.deprecated = True

            logger.error("setInfoByONNX", e)
            logger.error("############## !!!! CAUTION !!!! ####################")
            logger.error("This onnxfie is deprecated. Please regenerate onnxfile.")
            logger.error("############## !!!! CAUTION !!!! ####################")

        del tmp_onnx_session
        return slot
