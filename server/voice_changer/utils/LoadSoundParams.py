from dataclasses import dataclass

@dataclass
class LoadSoundParamFile:
    name: str
    dir: str


@dataclass
class LoadSoundParams:
    file: LoadSoundParamFile
    params: dict