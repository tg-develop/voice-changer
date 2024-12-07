import numpy as np
import torch
import onnxruntime
from const import PitchExtractorType
from voice_changer.common.OnnxLoader import load_onnx_model
from voice_changer.pitch_extractor.PitchExtractor import PitchExtractor
from voice_changer.common.deviceManager.DeviceManager import DeviceManager
from voice_changer.common.MelExtractor import MelSpectrogram

class RMVPEOnnxPitchExtractor(PitchExtractor):

    def __init__(self, file: str):
        super().__init__()
        self.file = file
        self.type: PitchExtractorType = "rmvpe_onnx"

        device_manager = DeviceManager.get_instance()
        self.is_half = device_manager.use_fp16()
        (
            onnxProviders,
            onnxProviderOptions,
        ) = device_manager.get_onnx_execution_provider()

        model = load_onnx_model(file, self.is_half)

        self.fp_dtype_t = torch.float16 if self.is_half else torch.float32
        self.fp_dtype_np = np.float16 if self.is_half else np.float32

        self.threshold = np.array(0.05, dtype=self.fp_dtype_np)

        so = onnxruntime.SessionOptions()
        # so.log_severity_level = 3
        # so.enable_profiling = True
        self.mel_extractor = MelSpectrogram(
            self.is_half, 128, 16000, 1024, 160, mel_fmin=30, mel_fmax=8000
        ).to(device_manager.device)
        self.onnx_session = onnxruntime.InferenceSession(model.SerializeToString(), sess_options=so, providers=onnxProviders, provider_options=onnxProviderOptions)

    def extract(
        self,
        audio: torch.Tensor,
        sr: int,
        window: int,
    ) -> torch.Tensor:
        mel = self.mel_extractor(audio.unsqueeze(0).float())

        if audio.device.type == 'cuda':
            binding = self.onnx_session.io_binding()

            binding.bind_input('mel', device_type='cuda', device_id=audio.device.index, element_type=self.fp_dtype_np, shape=tuple(mel.shape), buffer_ptr=mel.data_ptr())
            binding.bind_cpu_input('threshold', self.threshold)

            binding.bind_output('pitchf', device_type='cuda', device_id=audio.device.index)

            self.onnx_session.run_with_iobinding(binding)

            output = [output.numpy() for output in binding.get_outputs()]
        else:
            output: list[np.ndarray] = self.onnx_session.run(
                ["pitchf"],
                {
                    "mel": mel.detach().cpu().numpy(),
                    "threshold": self.threshold,
                },
            )
        # self.onnx_session.end_profiling()

        return torch.as_tensor(output[0], dtype=self.fp_dtype_t, device=audio.device).squeeze()