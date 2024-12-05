import certifi
import ssl
import aiohttp

CA_FILES = certifi.where()

class HttpClient:
    _instance = None

    def __init__(self):
        self.session: aiohttp.ClientSession = None

    @classmethod
    async def get_client(cls) -> aiohttp.ClientSession:
        if cls._instance is None:
            cls._instance = cls()
            ssl_context = ssl.create_default_context(cafile=CA_FILES)
            conn = aiohttp.TCPConnector(ssl_context=ssl_context)
            cls._instance.session = aiohttp.ClientSession(connector=conn)
        return cls._instance.session
