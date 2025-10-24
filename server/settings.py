from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict
from const import get_edition, RVCSampleMode, DOTENV_FILE
from functools import lru_cache

class ServerSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=DOTENV_FILE, env_file_encoding='utf-8', protected_namespaces=('model_config',))

    model_dir: str = 'model_dir'
    sound_dir: str = 'sound_dir'
    content_vec_500_onnx_on: bool = True
    sample_mode: RVCSampleMode = ''
    host: str = '127.0.0.1'
    port: int = 18888
    allowed_origins: Literal['*'] | list[str] = []
    edition: str = get_edition()

@lru_cache(maxsize=1)
def get_settings():
    return ServerSettings()
