# Voice Changer Server

This directory contains the backend server for the Voice Changer application, which provides real-time voice conversion using RVC (Retrieval-based Voice Conversion) models.

## Architecture Overview

The server follows a modular architecture with clear separation of concerns:

- **Web Server**: FastAPI for REST API + SocketIO for real-time WebSocket communication
- **Voice Processing**: RVC-based voice conversion with multiple inference engines
- **Model Management**: Dynamic loading and management of voice models
- **Audio Pipeline**: Real-time audio processing with pitch extraction and embedding

## Directory Structure

### 📁 Root Files

| File | Purpose |
|------|---------|
| `app.py` | Main ASGI application entry point - creates FastAPI and SocketIO instances |
| `main.py` | Server startup and configuration with uvicorn |
| `client.py` | Client wrapper that auto-launches browser (alternative to main.py) |
| `const.py` | Global constants and configuration paths |
| `settings.py` | Application settings and configuration management |
| `Exceptions.py` | Custom exception classes for error handling |

### 📁 `restapi/` - REST API Layer

HTTP REST endpoints for client-server communication:

| File | Purpose |
|------|---------|
| `MMVC_Rest.py` | Main FastAPI application with static file serving and middleware |
| `MMVC_Rest_Hello.py` | Health check and basic info endpoints |
| `MMVC_Rest_VoiceChanger.py` | Voice conversion endpoints and UI mode switching |
| `MMVC_Rest_Fileuploader.py` | File upload handling for models and audio |

#### 📁 `restapi/mods/`
| File | Purpose |
|------|---------|
| `FileUploader.py` | File upload utilities and validation |
| `trustedorigin.py` | CORS and trusted origin middleware |

### 📁 `sio/` - WebSocket Layer

Real-time communication via SocketIO:

| File | Purpose |
|------|---------|
| `MMVC_SocketIOServer.py` | SocketIO server configuration and event handlers |
| `MMVC_SocketIOApp.py` | SocketIO ASGI application wrapper |
| `MMVC_Namespace.py` | SocketIO namespace for voice changer events |

#### 📁 `sio/serializers/`
| File | Purpose |
|------|---------|
| `msgspec.py` | High-performance binary serialization for real-time audio data |

### 📁 `voice_changer/` - Core Voice Processing

Main voice conversion engine:

| File | Purpose |
|------|---------|
| `VoiceChangerManager.py` | Central manager for voice conversion operations |
| `VoiceChangerV2.py` | Voice conversion pipeline coordinator |
| `VoiceChangerSettings.py` | Configuration and settings for voice conversion |
| `ModelSlotManager.py` | Dynamic loading and management of voice models |
| `IORecorder.py` | Audio input/output recording and processing |

#### 📁 `voice_changer/RVC/` - RVC Implementation

RVC (Retrieval-based Voice Conversion) specific code:

| File | Purpose |
|------|---------|
| `RVCr2.py` | Main RVC implementation with model loading |
| `RVCModelMerger.py` | Model merging capabilities |
| `RVCModelSlotGenerator.py` | Dynamic model slot generation |
| `consts.py` | RVC-specific constants |

##### 📁 `voice_changer/RVC/inferencer/` - Inference Engines

Multiple inference implementations for different backends:

- `RVCInferencer.py` / `RVCInferencerNono.py` - PyTorch RVC inference
- `RVCInferencerv2.py` / `RVCInferencerv2Nono.py` - RVC v2 inference  
- `OnnxRVCInferencer.py` / `OnnxRVCInferencerNono.py` - ONNX Runtime inference
- `WebUIInferencer.py` / `WebUIInferencerNono.py` - WebUI compatibility
- `InferencerManager.py` - Manages multiple inference backends

##### 📁 `voice_changer/RVC/rvc_models/` - Model Architectures

Core RVC model implementations (PyTorch):
- `models.py` / `models_onnx.py` - Neural network architectures
- `attentions.py` / `attentions_onnx.py` - Attention mechanisms
- `commons.py`, `modules.py`, `transforms.py` - Model components

#### 📁 `voice_changer/common/` - Shared Components

Utilities used across different voice conversion methods:

| File | Purpose |
|------|---------|
| `FCPE.py` | FCPE (Fast Conditional Pitch Estimation) |
| `MelExtractor.py` / `MelExtractorFcpe.py` | Mel-spectrogram extraction |
| `STFT.py` | Short-Time Fourier Transform utilities |
| `OnnxLoader.py` | ONNX model loading utilities |
| `SafetensorsUtils.py` | SafeTensors format handling |
| `TorchUtils.py` | PyTorch utilities and device management |

##### 📁 `voice_changer/common/deviceManager/`
| File | Purpose |
|------|---------|
| `DeviceManager.py` | GPU/CPU device detection and management |
| `DummyDML.py` | DirectML compatibility layer |

##### 📁 `voice_changer/common/rmvpe/`
| File | Purpose |
|------|---------|
| `rmvpe.py` | RMVPE (Robust Mel-frequency Voiced/Unvoiced Pitch Estimation) |

#### 📁 `voice_changer/pitch_extractor/` - Pitch Analysis

Multiple pitch extraction algorithms:

| Algorithm | Files | Purpose |
|-----------|-------|---------|
| **CREPE** | `CrepePitchExtractor.py`, `CrepeOnnxPitchExtractor.py` | CREPE pitch estimation |
| **RMVPE** | `RMVPEPitchExtractor.py`, `RMVPEOnnxPitchExtractor.py` | RMVPE pitch estimation |
| **FCPE** | `FcpePitchExtractor.py`, `FcpeOnnxPitchExtractor.py` | FCPE pitch estimation |
| **Core** | `PitchExtractor.py`, `PitchExtractorManager.py` | Base classes and management |

##### 📁 `voice_changer/pitch_extractor/onnxcrepe/`
ONNX-optimized CREPE implementation for faster inference

##### 📁 `voice_changer/pitch_extractor/torchcrepe/`
PyTorch CREPE implementation

#### 📁 `voice_changer/embedder/` - Voice Embeddings

Voice feature extraction:

| File | Purpose |
|------|---------|
| `EmbedderManager.py` | Manages different embedding models |
| `Embedder.py`, `OnnxEmbedder.py` | Embedding extraction implementations |
| `EmbedderProtocol.py` | Interface for embedding extractors |

#### 📁 `voice_changer/Local/` - Local Audio

| File | Purpose |
|------|---------|
| `ServerAudio.py` | Server-side audio device handling |
| `AudioDeviceList.py` | Audio device enumeration |

#### 📁 `voice_changer/utils/` - Voice Changer Utilities

| File | Purpose |
|------|---------|
| `ModelMerger.py` | Model merging utilities |
| `ModelSlotGenerator.py` | Model slot generation |
| `LoadModelParams.py` | Model parameter loading |
| `VoiceChangerModel.py` | Model abstraction layer |
| `Timer.py` | Performance timing utilities |

### 📁 `data/` - Data Models

| File | Purpose |
|------|---------|
| `ModelSlot.py` | Model slot data structures |
| `ModelSample.py` | Sample data management |

### 📁 `downloader/` - Model Downloads

| File | Purpose |
|------|---------|
| `SampleDownloader.py` | Downloads sample models from remote repositories |
| `WeightDownloader.py` | Downloads model weights |
| `HttpClient.py` | HTTP utilities for downloads |
| `Downloader.py` | Base downloader class |

### 📁 `mods/` - Server Modifications

| File | Purpose |
|------|---------|
| `origins.py` | CORS origin calculation and validation |
| `ssl.py` | SSL certificate utilities |

### 📁 `utils/` - General Utilities

| File | Purpose |
|------|---------|
| `fcpe_onnx.py` | FCPE ONNX utilities |
| `rmvpe_onnx.py` | RMVPE ONNX utilities |
| `hasher.py` | File hashing utilities |
| `strtobool.py` | String to boolean conversion |

### 📁 `pyinstaller-hooks/` - Packaging

| File | Purpose |
|------|---------|
| `hook-voice_changer.py` | PyInstaller hooks for bundling |

### 📁 Runtime Directories

| Directory | Purpose |
|-----------|---------|
| `model_dir/` | Storage for voice models and configurations |
| `pretrain/` | Pre-trained models (embedders, pitch extractors) |
| `tmp_dir/` | Temporary files during processing |
| `upload_dir/` | Uploaded files staging area |
| `dist/` | Built/compiled application |

### 📁 Configuration Files

| File | Purpose |
|------|---------|
| `requirements-*.txt` | Python dependencies for different platforms |
| `MMVCServerSIO.spec` | PyInstaller specification |
| `edition.txt` | Application edition identifier |
| `stored_setting.json` | Persistent user settings |
| `vcclient.log` | Application logs |

## Key Features

### 🎯 **Real-time Voice Conversion**
- Low-latency voice processing pipeline
- Multiple inference backends (PyTorch, ONNX)
- GPU acceleration support (CUDA, DirectML, ROCm)

### 🔄 **Dynamic Model Management**
- Hot-swapping of voice models without restart
- Model merging capabilities
- Automatic model downloads

### 🌐 **Dual Interface Support**
- Modern React-based UI
- Classic demo UI
- Runtime UI switching without server restart

### 🎵 **Advanced Audio Processing**
- Multiple pitch extraction algorithms
- Voice embeddings with ContentVec, HuBERT
- Real-time audio effects and filtering

### 🚀 **High Performance**
- Binary serialization for real-time data
- Efficient memory management
- Multi-threaded audio processing

## Getting Started

1. **Install Dependencies**: `pip install -r requirements-<platform>.txt`
2. **Run Server**: `python main.py` or `python client.py`
3. **Access UI**: Navigate to `http://localhost:18888`

## Architecture Benefits

- **Modular Design**: Easy to extend with new algorithms
- **Platform Support**: Works on Windows, Linux, macOS
- **Scalable**: Can handle multiple concurrent voice conversions
- **Maintainable**: Clear separation of concerns and responsibilities