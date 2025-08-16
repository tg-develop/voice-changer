export declare const VoiceChangerType: {
    readonly RVC: "RVC";
};
export type VoiceChangerType = (typeof VoiceChangerType)[keyof typeof VoiceChangerType];
export declare const InputSampleRate: {
    readonly "48000": 48000;
    readonly "44100": 44100;
    readonly "24000": 24000;
};
export type InputSampleRate = (typeof InputSampleRate)[keyof typeof InputSampleRate];
export declare const ModelSamplingRate: {
    readonly "48000": 48000;
    readonly "40000": 40000;
    readonly "32000": 32000;
};
export type ModelSamplingRate = (typeof InputSampleRate)[keyof typeof InputSampleRate];
export declare const F0Detector: {
    readonly dio: "dio";
    readonly harvest: "harvest";
    readonly crepe_full: "crepe_full";
    readonly crepe_tiny: "crepe_tiny";
    readonly crepe_full_onnx: "crepe_full_onnx";
    readonly crepe_tiny_onnx: "crepe_tiny_onnx";
    readonly rmvpe: "rmvpe";
    readonly rmvpe_onnx: "rmvpe_onnx";
    readonly fcpe: "fcpe";
    readonly fcpe_onnx: "fcpe_onnx";
};
export type F0Detector = (typeof F0Detector)[keyof typeof F0Detector];
export declare const DiffMethod: {
    readonly pndm: "pndm";
    readonly "dpm-solver": "dpm-solver";
};
export type DiffMethod = (typeof DiffMethod)[keyof typeof DiffMethod];
export type AudioChannel = 'input' | 'output';
export interface AudioEffect {
    type: string;
    channel: AudioChannel;
    enabled: boolean;
    parameters: Record<string, number | boolean | string>;
}
export type AudioEffectsConfiguration = AudioEffect[];
export interface AudioEffectParameterDefinition {
    name: string;
    type: 'slider' | 'toggle' | 'select';
    defaultValue: number | boolean | string;
    min?: number;
    max?: number;
    step?: number;
    options?: string[];
    unit?: string;
    description?: string;
}
export interface AudioEffectDefinition {
    name: string;
    description: string;
    provider?: string;
    parameters: Record<string, AudioEffectParameterDefinition>;
}
export type AudioEffectDefinitions = Record<string, AudioEffectDefinition>;
export interface AudioEffectsSchema {
    [effectType: string]: AudioEffectDefinition;
}
export interface AudioEffectsProviderInfo {
    name: string;
    available: boolean;
    supported_effects: string[];
    effect_count: number;
}
export interface AudioEffectsProvidersResponse {
    providers: AudioEffectsProviderInfo[];
    total_effects: number;
}
export declare const RVCModelType: {
    readonly pyTorchRVC: "pyTorchRVC";
    readonly pyTorchRVCNono: "pyTorchRVCNono";
    readonly pyTorchRVCv2: "pyTorchRVCv2";
    readonly pyTorchRVCv2Nono: "pyTorchRVCv2Nono";
    readonly pyTorchWebUI: "pyTorchWebUI";
    readonly pyTorchWebUINono: "pyTorchWebUINono";
    readonly onnxRVC: "onnxRVC";
    readonly onnxRVCNono: "onnxRVCNono";
};
export type RVCModelType = (typeof RVCModelType)[keyof typeof RVCModelType];
export declare const ServerSettingKey: {
    readonly passThrough: "passThrough";
    readonly srcId: "srcId";
    readonly dstId: "dstId";
    readonly gpu: "gpu";
    readonly crossFadeOverlapSize: "crossFadeOverlapSize";
    readonly framework: "framework";
    readonly onnxExecutionProvider: "onnxExecutionProvider";
    readonly f0Factor: "f0Factor";
    readonly f0Detector: "f0Detector";
    readonly recordIO: "recordIO";
    readonly enableServerAudio: "enableServerAudio";
    readonly serverAudioStated: "serverAudioStated";
    readonly serverAudioSampleRate: "serverAudioSampleRate";
    readonly serverInputAudioSampleRate: "serverInputAudioSampleRate";
    readonly serverOutputAudioSampleRate: "serverOutputAudioSampleRate";
    readonly serverMonitorAudioSampleRate: "serverMonitorAudioSampleRate";
    readonly serverInputAudioBufferSize: "serverInputAudioBufferSize";
    readonly serverOutputAudioBufferSize: "serverOutputAudioBufferSize";
    readonly serverInputDeviceId: "serverInputDeviceId";
    readonly serverOutputDeviceId: "serverOutputDeviceId";
    readonly serverMonitorDeviceId: "serverMonitorDeviceId";
    readonly serverReadChunkSize: "serverReadChunkSize";
    readonly serverInputAudioGain: "serverInputAudioGain";
    readonly serverOutputAudioGain: "serverOutputAudioGain";
    readonly serverMonitorAudioGain: "serverMonitorAudioGain";
    readonly asioInputChannel: "asioInputChannel";
    readonly asioOutputChannel: "asioOutputChannel";
    readonly tran: "tran";
    readonly formantShift: "formantShift";
    readonly useONNX: "useONNX";
    readonly silentThreshold: "silentThreshold";
    readonly extraConvertSize: "extraConvertSize";
    readonly indexRatio: "indexRatio";
    readonly protect: "protect";
    readonly forceFp32: "forceFp32";
    readonly disableJit: "disableJit";
    readonly modelSamplingRate: "modelSamplingRate";
    readonly silenceFront: "silenceFront";
    readonly modelSlotIndex: "modelSlotIndex";
    readonly inputSampleRate: "inputSampleRate";
    readonly audioEffects: "audioEffects";
};
export type ServerSettingKey = (typeof ServerSettingKey)[keyof typeof ServerSettingKey];
export type VoiceChangerServerSetting = {
    passThrough: boolean;
    srcId: number;
    dstId: number;
    gpu: number;
    crossFadeOverlapSize: number;
    f0Factor: number;
    f0Detector: F0Detector;
    recordIO: number;
    enableServerAudio: number;
    serverAudioStated: number;
    serverAudioSampleRate: number;
    serverInputAudioSampleRate: number;
    serverOutputAudioSampleRate: number;
    serverMonitorAudioSampleRate: number;
    serverInputAudioBufferSize: number;
    serverOutputAudioBufferSize: number;
    serverInputDeviceId: number;
    serverOutputDeviceId: number;
    serverMonitorDeviceId: number;
    serverReadChunkSize: number;
    serverInputAudioGain: number;
    serverOutputAudioGain: number;
    serverMonitorAudioGain: number;
    asioInputChannel: number;
    asioOutputChannel: number;
    tran: number;
    formantShift: number;
    useONNX: number;
    silentThreshold: number;
    extraConvertSize: number;
    indexRatio: number;
    protect: number;
    silenceFront: number;
    forceFp32: number;
    disableJit: number;
    modelSamplingRate: ModelSamplingRate;
    modelSlotIndex: number;
    inputSampleRate: InputSampleRate;
    audioEffects: AudioEffectsConfiguration;
};
type ModelSlot = {
    slotIndex: number;
    voiceChangerType: VoiceChangerType;
    name: string;
    description: string;
    credit: string;
    termsOfUseUrl: string;
    iconFile: string;
    speakers: {
        [key: number]: string;
    };
    isONNX: boolean;
};
export type RVCModelSlot = ModelSlot & {
    modelFile: string;
    modelFileOnnx: string;
    indexFile: string;
    defaultIndexRatio: number;
    defaultProtect: number;
    defaultTune: number;
    defaultFormantShift: number;
    modelType: RVCModelType;
    modelTypeOnnx: string;
    embChannels: number;
    f0: boolean;
    samplingRate: number;
    deprecated: boolean;
};
export type ModelSlotUnion = RVCModelSlot;
type ServerAudioDevice = {
    index: number;
    name: string;
    hostAPI: string;
    maxInputChannels: number;
    maxOutputChannels: number;
    default_samplerate: number;
};
export type ServerInfo = VoiceChangerServerSetting & {
    status: string;
    modelSlots: ModelSlotUnion[];
    serverAudioInputDevices: ServerAudioDevice[];
    serverAudioOutputDevices: ServerAudioDevice[];
    sampleModels: RVCSampleModel[];
    gpus: {
        id: number;
        name: string;
        memory: number;
    }[];
    maxInputLength: number;
    voiceChangerParams: {
        model_dir: string;
    };
    audioEffectsSchema: AudioEffectsSchema;
    audioEffectsProviders: AudioEffectsProvidersResponse;
};
export type SampleModel = {
    id: string;
    voiceChangerType: VoiceChangerType;
    lang: string;
    tag: string[];
    name: string;
    modelUrl: string;
    termsOfUseUrl: string;
    icon: string;
    credit: string;
    description: string;
    sampleRate: number;
    modelType: string;
    f0: boolean;
};
export type RVCSampleModel = SampleModel & {
    indexUrl: string;
    featureUrl: string;
};
export declare const DefaultServerSetting: ServerInfo;
export type WorkletSetting = {};
export declare const Protocol: {
    readonly sio: "sio";
    readonly rest: "rest";
};
export type Protocol = (typeof Protocol)[keyof typeof Protocol];
export declare const SendingSampleRate: {
    readonly "48000": 48000;
    readonly "44100": 44100;
    readonly "24000": 24000;
};
export type SendingSampleRate = (typeof SendingSampleRate)[keyof typeof SendingSampleRate];
export declare const DownSamplingMode: {
    readonly decimate: "decimate";
    readonly average: "average";
};
export type DownSamplingMode = (typeof DownSamplingMode)[keyof typeof DownSamplingMode];
export type WorkletNodeSetting = {
    serverUrl: string;
    protocol: Protocol;
    sendingSampleRate: SendingSampleRate;
    inputChunkNum: number;
    downSamplingMode: DownSamplingMode;
};
export declare const SampleRate: {
    readonly "48000": 48000;
};
export type SampleRate = (typeof SampleRate)[keyof typeof SampleRate];
export type VoiceChangerClientSetting = {
    audioInput: string | MediaStream | null;
    sampleRate: SampleRate;
    echoCancel: boolean;
    noiseSuppression: boolean;
    noiseSuppression2: boolean;
    inputGain: number;
    outputGain: number;
    monitorGain: number;
    passThroughConfirmationSkip: boolean;
};
export type ClientSetting = {
    workletSetting: WorkletSetting;
    workletNodeSetting: WorkletNodeSetting;
    voiceChangerClientSetting: VoiceChangerClientSetting;
};
export declare const DefaultClientSettng: ClientSetting;
export declare const VOICE_CHANGER_CLIENT_EXCEPTION: {
    readonly ERR_SIO_CONNECT_FAILED: "ERR_SIO_CONNECT_FAILED";
    readonly ERR_SIO_INVALID_RESPONSE: "ERR_SIO_INVALID_RESPONSE";
    readonly ERR_REST_INVALID_RESPONSE: "ERR_REST_INVALID_RESPONSE";
    readonly ERR_MIC_STREAM_NOT_INITIALIZED: "ERR_MIC_STREAM_NOT_INITIALIZED";
    readonly ERR_INTERNAL_AUDIO_PROCESS_CALLBACK_IS_NOT_INITIALIZED: "ERR_INTERNAL_AUDIO_PROCESS_CALLBACK_IS_NOT_INITIALIZED";
    readonly ERR_GENERIC_VOICE_CHANGER_EXCEPTION: "ERR_GENERIC_VOICE_CHANGER_EXCEPTION";
};
export type VOICE_CHANGER_CLIENT_EXCEPTION = (typeof VOICE_CHANGER_CLIENT_EXCEPTION)[keyof typeof VOICE_CHANGER_CLIENT_EXCEPTION];
export declare const INDEXEDDB_DB_APP_NAME = "INDEXEDDB_KEY_VOICE_CHANGER";
export declare const INDEXEDDB_DB_NAME = "INDEXEDDB_KEY_VOICE_CHANGER_DB";
export declare const INDEXEDDB_KEY_CLIENT = "INDEXEDDB_KEY_VOICE_CHANGER_LIB_CLIENT";
export declare const INDEXEDDB_KEY_SERVER = "INDEXEDDB_KEY_VOICE_CHANGER_LIB_SERVER";
export declare const INDEXEDDB_KEY_MODEL_DATA = "INDEXEDDB_KEY_VOICE_CHANGER_LIB_MODEL_DATA";
export type OnnxExporterInfo = {
    status: string;
    path: string;
    filename: string;
};
export type MergeElement = {
    slotIndex: number;
    strength: number;
};
export type MergeModelRequest = {
    voiceChangerType: VoiceChangerType;
    command: "mix";
    files: MergeElement[];
};
export {};
