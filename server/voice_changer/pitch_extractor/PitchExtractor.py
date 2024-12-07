from typing import Protocol
import torch


class PitchExtractor(Protocol):
    type: str

    def extract(
        self,
        audio: torch.Tensor,
        sr: int,
        window: int,
    ) -> torch.Tensor:
        ...

    def getPitchExtractorInfo(self):
        return {
            "pitchExtractorType": self.type,
        }
