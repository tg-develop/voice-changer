from dataclasses import dataclass
from typing import Optional

@dataclass
class RandomConfig:
    minPauseSec: int = 3
    maxPauseSec: int = 5

@dataclass
class SoundSlot: 
    id: str = ""
    name: str = ""
    enabled: bool = False
    gainDb: float = 0.0
    mode: str = "loop"
    filename: str = ""
    loopPauseSec: Optional[int] = 0
    random: Optional[RandomConfig] = None
