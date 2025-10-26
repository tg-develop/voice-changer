import os
import sys
import multiprocessing as mp

from const import ROOT_PATH, UPLOAD_DIR, TMP_DIR, LOG_FILE, get_version, get_edition

import asyncio
import logging
import argparse
from datetime import datetime
from Exceptions import setup_event_loop

from downloader.ModelManager import ModelManager
from settings import get_settings
from webserver.server import WebServer

# Add the project root to the Python path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)

# NOTE: This is required to fix current working directory on macOS
os.chdir(ROOT_PATH)

# NOTE: This is required to avoid recursive process call bug for macOS
mp.freeze_support()

# Initialize settings and logger at module level
settings = get_settings()
logger = logging.getLogger(__name__)

def setup_logging(log_level: str = 'info'):
    """Configure logging for the application."""
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(log_level.upper())

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)-15s %(levelname)-8s [%(module)s] %(message)s",
        handlers=[logging.FileHandler(LOG_FILE), stream_handler]
    )
    return logging.getLogger(__name__)

def setup_arg_parser():
    """Set up and return the argument parser."""
    parser = argparse.ArgumentParser(description="Run the voice changer server.")
    parser.add_argument(
        "--log-level", 
        type=str, 
        default="info", 
        choices=["debug", "info", "warning", "error", "critical"],
        help="Set the logging level"
    )
    parser.add_argument(
        "--launch-browser",
        action="store_true",
        help="Open the web interface in the default browser on startup"
    )
    return parser

async def main():
    """Main entry point for the application."""
    parser = setup_arg_parser()
    args = parser.parse_args()
    
    # Setup logging
    global logger
    logger = setup_logging(args.log_level)
    
    logger.info(f"Python: {sys.version}")
    logger.info(f"Voice changer version: {get_version()} {get_edition()}")
    
    # Create necessary directories
    os.makedirs(settings.model_dir, exist_ok=True)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(TMP_DIR, exist_ok=True)
    
    logger.info(f"Server settings: {settings}")
    
    # Initialize and start the web server
    server = WebServer(
        host=settings.host,
        port=settings.port,
        log_level=args.log_level
    )
    
    # Check for mandatory models
    logger.info("Checking for mandatory models...")
    await ModelManager.check_and_download_mandatory_models()
    
    # Start the server
    await server.start(
        launch_browser=args.launch_browser,
        ssl_keyfile=settings.ssl_keyfile,
        ssl_certfile=settings.ssl_certfile,
        ssl_self_signed=settings.ssl_enabled and not (settings.ssl_keyfile and settings.ssl_certfile)
    )


if __name__ == "__main__":
    try:
        # Initialize settings and logger at the module level
        settings = get_settings()
        logger = setup_logging('info')
        
        # Set up event loop with connection reset handling
        loop = setup_event_loop()
        
        # Run the application
        loop.run_until_complete(main())
        
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        if 'logger' in globals():
            logger.exception("An error occurred while running the server")
        else:
            print(f"Critical error: {str(e)}")
        raise e
    finally:
        # Clean up the event loop
        if 'loop' in locals():
            loop.close()
