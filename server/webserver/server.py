import os
import sys
import asyncio
import logging
import socket
import threading
from typing import Optional
from pathlib import Path
from webbrowser import open_new_tab

# Add the project root to the Python path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import uvicorn

# Now we can use absolute imports
from settings import get_settings
from webserver.restapi.mods.Certificate import create_self_signed_cert
from utils.strtobool import strtobool

logger = logging.getLogger(__name__)
settings = get_settings()

class WebServer:
    def __init__(self, host: str, port: int, log_level: str = 'info'):
        self.host = host
        self.port = port
        self.log_level = log_level
        self.ssl_keyfile: Optional[str] = None
        self.ssl_certfile: Optional[str] = None
        self.server: Optional[uvicorn.Server] = None
        
        # Automatically enable HTTPS for non-localhost addresses
        if self.host not in ['127.0.0.1', 'localhost', '0.0.0.0'] and not settings.ssl_enabled:
            logger.warning(f'Non-localhost address detected ({self.host}). HTTPS is required to initialize the audio context.')
            settings.ssl_enabled = True

    async def _wait_for_server(self, proto: str, launch_browser: bool = False):
        """Wait for the server to start and open browser if requested."""
        while True:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                result = sock.connect_ex((self.host, self.port))
                if result == 0:
                    break
        
        logger.info('-' * 8)
        proto = 'https' if settings.ssl_enabled else 'http'
        logger.info(f"The server is listening on {proto}://{self.host}:{self.port}/")
        if settings.ssl_enabled:
            if settings.ssl_keyfile and settings.ssl_certfile:
                logger.info(f"Using SSL with certificate: {settings.ssl_certfile}")
            else:
                logger.info("Using self-signed SSL certificate")
        logger.info('-' * 8)
        if launch_browser:
            open_new_tab(f'{proto}://{self.host}:{self.port}')

    async def _create_ssl_context(self, ssl_keyfile: Optional[str] = None, 
                               ssl_certfile: Optional[str] = None,
                               ssl_self_signed: bool = True) -> tuple[Optional[str], Optional[str]]:
        """Handle SSL certificate creation and validation."""
        # Use paths from settings if not explicitly provided
        ssl_keyfile = ssl_keyfile or settings.ssl_keyfile
        ssl_certfile = ssl_certfile or settings.ssl_certfile
        
        if not ssl_keyfile or not ssl_certfile:
            if ssl_self_signed:
                # Use SSL key directory from const
                from const import SSL_KEY_DIR
                ssl_dir = Path(SSL_KEY_DIR)
                ssl_dir.mkdir(exist_ok=True, parents=True)
                
                key_path = ssl_dir / f"{self.host.replace('.', '_')}.key"
                cert_path = ssl_dir / f"{self.host.replace('.', '_')}.crt"
                
                if not key_path.exists() or not cert_path.exists():
                    logger.info(f"Generating new self-signed certificate for {self.host}")
                    certargs = {
                        'Country': "US",
                        'State': "x",
                        'City': "x",
                        'Organization': "x",
                        'Org. Unit': "x",
                        'CommonName': self.host,
                        'Email': "x"
                    }
                    create_self_signed_cert(
                        certfile=cert_path.name,
                        keyfile=key_path.name,
                        certargs=certargs,
                        cert_dir=str(ssl_dir)
                    )
                return str(key_path), str(cert_path)
            return None, None
        return ssl_keyfile, ssl_certfile

    async def start(self, launch_browser: bool = False, 
                  ssl_keyfile: Optional[str] = None, 
                  ssl_certfile: Optional[str] = None,
                  ssl_self_signed: bool = True):
        """Start the web server."""
        # Handle SSL
        if settings.ssl_enabled:
            self.ssl_keyfile, self.ssl_certfile = await self._create_ssl_context(
                ssl_keyfile or settings.ssl_keyfile,
                ssl_certfile or settings.ssl_certfile,
                ssl_self_signed
            )
        
        # Start server in a separate thread
        config = uvicorn.Config(
            "app:socketio",
            host=self.host,
            port=self.port,
            reload=False,
            ssl_keyfile=self.ssl_keyfile,
            ssl_certfile=self.ssl_certfile,
            log_level="error"
        )
        
        self.server = uvicorn.Server(config)
        
        # Start server status checker
        proto = 'https' if self.ssl_keyfile and self.ssl_certfile else 'http'
        threading.Thread(
            target=lambda: asyncio.run(self._wait_for_server(proto, launch_browser)),
            daemon=True
        ).start()
        
        await self.server.serve()

    async def stop(self):
        """Stop the web server gracefully."""
        if self.server:
            self.server.should_exit = True
            await self.server.shutdown()
