import os
import shutil
import zipfile
from pathlib import Path
from typing import Optional, Tuple, Set, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class FileUtils:
    """Utility class for file operations including ZIP handling."""
    
    @staticmethod
    def extract_zip(
        zip_path: str, 
        extract_to: str, 
        allowed_model_extensions: Optional[Set[str]] = None,
        allowed_index_extensions: Optional[Set[str]] = None
    ) -> Dict[str, Any]:
        """
        Extract zip file and return information about extracted files.
        
        Args:
            zip_path: Path to the ZIP file
            extract_to: Directory to extract files to
            allowed_model_extensions: Set of allowed model file extensions
            allowed_index_extensions: Set of allowed index file extensions
            
        Returns:
            Dict containing information about extracted files
        """
        model_exts = allowed_model_extensions or {'.pth', '.pt', '.safetensors', '.onnx'}
        index_exts = allowed_index_extensions or {'.index'}
        
        result = {
            'success': False,
            'model_file': None,
            'index_file': None,
            'files': [],
            'error': None
        }
        
        temp_dir = None
        
        try:
            if not os.path.exists(zip_path) or not zipfile.is_zipfile(zip_path):
                result['error'] = "Invalid or missing ZIP file"
                return result
                
            temp_dir = os.path.join(os.path.dirname(extract_to), f"temp_{os.urandom(8).hex()}")
            os.makedirs(temp_dir, exist_ok=True)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_contents = zip_ref.namelist()
                
                # Find all model and index files recursively
                model_files = []
                index_files = []
                
                for file in zip_contents:
                    # Skip directories
                    if file.endswith('/') or file.endswith('\\'):
                        continue
                        
                    file_lower = file.lower()
                    if any(file_lower.endswith(ext) for ext in model_exts):
                        model_files.append(file)
                    elif any(file_lower.endswith(ext) for ext in index_exts):
                        index_files.append(file)
                
                if not model_files:
                    result['error'] = "No valid model file found in ZIP archive"
                    return result
                
                # If multiple model files found, prefer files in root directory or with shorter paths
                if len(model_files) > 1:
                    # Sort by path depth (shallow first) and then alphabetically
                    model_files.sort(key=lambda x: (x.count('/') + x.count('\\'), x.lower()))
                    # Keep only the first (best) model file
                    model_files = [model_files[0]]
                
                # Get all files to extract (model file + all index files)
                files_to_extract = model_files + index_files
                
                # Create target directory if it doesn't exist
                os.makedirs(extract_to, exist_ok=True)
                
                # Extract files
                extracted_files = []
                for file in files_to_extract:
                    try:
                        zip_ref.extract(file, temp_dir)
                        src_path = os.path.join(temp_dir, file)
                        dest_path = os.path.join(extract_to, file)
                        
                        # Create subdirectories if needed
                        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                        
                        # Move file to final destination
                        if os.path.exists(dest_path):
                            os.remove(dest_path)
                        shutil.move(src_path, dest_path)
                        
                        # Update result with file info
                        file_lower = file.lower()
                        if any(file_lower.endswith(ext) for ext in model_exts):
                            # Store relative path from ZIP root
                            result['model_file'] = file
                            logger.info(f"Found model file: {file}")
                        elif any(file_lower.endswith(ext) for ext in index_exts):
                            # Only update index file if not already set or if this one is in a more specific path
                            if result['index_file'] is None or file.count('/') + file.count('\\') < result['index_file'].count('/') + result['index_file'].count('\\'):
                                result['index_file'] = file
                                logger.info(f"Found index file: {file}")
                        
                        extracted_files.append(file)
                        logger.debug(f"Extracted: {file}")
                        
                        # If this is the model file, ensure it's in the root of the extraction directory
                        if any(file_lower.endswith(ext) for ext in model_exts) and ('/' in file or '\\' in file):
                            # Move the model file to the root of the extraction directory
                            base_name = os.path.basename(file)
                            root_dest = os.path.join(extract_to, base_name)
                            if os.path.exists(root_dest):
                                os.remove(root_dest)
                            shutil.move(dest_path, root_dest)
                            result['model_file'] = base_name
                            logger.info(f"Moved model file to root: {base_name}")
                    except Exception as e:
                        logger.warning(f"Failed to extract {file}: {str(e)}")
                
                if not result['model_file']:
                    result['error'] = "No valid model file found in ZIP archive"
                    return result
                
                result['success'] = True
                result['files'] = extracted_files
                
        except zipfile.BadZipFile:
            result['error'] = "Invalid or corrupted ZIP file"
        except Exception as e:
            result['error'] = f"Failed to extract ZIP file: {str(e)}"
            logger.exception("Error extracting ZIP file")
        finally:
            # Clean up temporary directory
            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
        
        return result
    
    @staticmethod
    def find_first_file(directory: str, extensions: Set[str]) -> Optional[str]:
        """Find the first file in directory with one of the given extensions."""
        if not os.path.isdir(directory):
            return None
            
        for root, _, files in os.walk(directory):
            for file in files:
                if any(file.lower().endswith(ext) for ext in extensions):
                    return os.path.join(root, file)
        return None
    
    @staticmethod
    def safe_remove(path: str) -> bool:
        """Safely remove a file or directory."""
        try:
            if os.path.isfile(path):
                os.remove(path)
            elif os.path.isdir(path):
                shutil.rmtree(path)
            return True
        except Exception as e:
            logger.warning(f"Failed to remove {path}: {str(e)}")
            return False
    
    @staticmethod
    def ensure_directory(path: str) -> bool:
        """Ensure a directory exists, creating it if necessary."""
        try:
            os.makedirs(path, exist_ok=True)
            return True
        except Exception as e:
            logger.error(f"Failed to create directory {path}: {str(e)}")
            return False
