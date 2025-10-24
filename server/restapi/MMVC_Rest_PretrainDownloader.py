import logging
from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse

# Import the ModelManager
from downloader.ModelManager import ModelManager

logger = logging.getLogger(__name__)

class MMVC_Rest_PretrainDownloader:
    def __init__(self):
        self.router = APIRouter()
        self.router.add_api_route("/download_pretrain", self.download_pretrain, methods=["POST"])
        self.router.add_api_route("/delete_pretrain", self.delete_pretrain, methods=["POST"])

    async def download_pretrain(self, model_key: str = Form(...)):
        """
        Download a pretrained model by its key.
        
        Args:
            model_key: Key of the model (e.g., 'crepe_onnx_full', 'rmvpe_onnx')
            
        Returns:
            JSON response with status and message
        """
        try:
            result = await ModelManager.download_model(model_key)
            return JSONResponse(status_code=200, content=result)
            
        except ValueError as ve:
            status_code = 400 if "mandatory" in str(ve) else 404
            raise HTTPException(status_code=status_code, detail=str(ve))
        except Exception as e:
            logger.exception(f"Error downloading model {model_key}")
            raise HTTPException(status_code=500, detail=str(e))

    async def delete_pretrain(self, model_key: str = Form(...)):
        """
        Delete a downloaded pretrained model.
        
        Args:
            model_key: Key of the model (e.g., 'crepe_onnx_full', 'rmvpe_onnx')
            
        Returns:
            JSON response with status and message
        """
        try:
            result = ModelManager.delete_model(model_key)
            return JSONResponse(status_code=200, content=result)
            
        except ValueError as ve:
            status_code = 400 if "mandatory" in str(ve) else 404
            raise HTTPException(status_code=status_code, detail=str(ve))
        except Exception as e:
            logger.exception(f"Error deleting model {model_key}")
            raise HTTPException(status_code=500, detail=str(e))