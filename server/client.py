import sys

def pause_excepthook(type, value, traceback, oldhook=sys.excepthook):
    oldhook(type, value, traceback)
    input('\nPress Enter to continue...')

sys.excepthook = pause_excepthook

import asyncio
from main import setup_arg_parser, main
from utils.strtobool import strtobool

import logging
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    # Add --launch-browser to sys.argv if not already present
    if "--launch-browser" not in sys.argv:
        sys.argv.append("--launch-browser")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass