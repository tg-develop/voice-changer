from typing import Protocol
from const import VoiceChangerType
from dataclasses import dataclass
from settings import ServerSettings


@dataclass
class MergeElement:
    slotIndex: int
    strength: int


@dataclass
class ModelMergerRequest:
    voiceChangerType: VoiceChangerType
    command: str
    files: list[MergeElement]


class ModelMerger(Protocol):
    @classmethod
    def merge_models(cls, params: ServerSettings, request: ModelMergerRequest, store_slot: int) -> str:
        ...
