import socketio
import logging
from webserver.restapi.mods.Origins import compute_local_origins, normalize_origins

from settings import get_settings
from webserver.sio.MMVC_SocketIOServer import MMVC_SocketIOServer
from voice_changer.VoiceChangerManager import VoiceChangerManager
from const import FRONTEND_DIR

logger = logging.getLogger(__name__)


class MMVC_SocketIOApp:
    _instance: socketio.ASGIApp | None = None

    @classmethod
    def get_instance(
        cls,
        app_fastapi,
        voiceChangerManager: VoiceChangerManager,
    ):
        if cls._instance is None:
            settings = get_settings()
            logger.info("Initializing...")

            allowed_origins: set[str] = set()
            if '*' in settings.allowed_origins:
                sio = MMVC_SocketIOServer.get_instance(voiceChangerManager, '*')
            else:
                local_origins = compute_local_origins(settings.port)
                allowed_origins.update(local_origins)
                if settings.allowed_origins is not None:
                    normalized_origins = normalize_origins(settings.allowed_origins)
                    allowed_origins.update(normalized_origins)
                sio = MMVC_SocketIOServer.get_instance(voiceChangerManager, list(allowed_origins))

            app_socketio = socketio.ASGIApp(
                sio,
                other_asgi_app=app_fastapi,
                static_files={
                    "": FRONTEND_DIR,
                    "/": f"{FRONTEND_DIR}/index.html",
                },
            )

            cls._instance = app_socketio
            logger.info("Initialized.")
            return cls._instance

        return cls._instance
