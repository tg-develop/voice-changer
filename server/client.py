import sys
from utils.check_user_admin import is_user_admin

def pause_excepthook(type, value, traceback, oldhook=sys.excepthook):
    oldhook(type, value, traceback)
    input('\nPress Enter to continue...')

sys.excepthook = pause_excepthook

import asyncio
from main import setupArgParser, main
from utils.strtobool import strtobool

import logging
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    if not is_user_admin():
        logger.warning("Voice changer is running with user rights. If you are using NVIDIA version, restart the voice changer with administrator rights. Otherwise, performance issues may be observed.")

    parser = setupArgParser()
    parser.add_argument("--launch-browser", type=strtobool, default=True, help="Automatically launches web browser and opens the voice changer's interface.")
    args, _ = parser.parse_known_args()

    asyncio.run(main(args))