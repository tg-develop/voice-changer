from abc import ABC, abstractmethod
from typing import Dict, Any, Literal
import torch

AudioChannel = Literal["input", "output"]


class AudioEffect(ABC):
    def __init__(self, effect_type: str, channel: AudioChannel, order: int = 0):
        self.effect_type = effect_type
        self.channel = channel
        self.order = order  # Execution order within the chain
        self.enabled = True
        self.parameters: Dict[str, Any] = {}
    
    @abstractmethod
    def process(self, audio: torch.Tensor, sample_rate: int) -> torch.Tensor:
        pass
    
    def set_parameters(self, parameters: Dict[str, Any]) -> None:
        self.parameters.update(parameters)
    
    def get_parameters(self) -> Dict[str, Any]:
        return self.parameters.copy()
    
    def set_enabled(self, enabled: bool) -> None:
        self.enabled = enabled
    
    def is_enabled(self) -> bool:
        return self.enabled
    
    def get_effect_info(self) -> Dict[str, Any]:
        return {
            "type": self.effect_type,
            "channel": self.channel,
            "order": self.order,
            "enabled": self.enabled,
            "parameters": self.parameters
        }