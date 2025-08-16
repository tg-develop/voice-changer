import { VOICE_CHANGER_CLIENT_EXCEPTION, WorkletNodeSetting, WorkletSetting } from "../const";
export type VoiceChangerWorkletListener = {
    notifySendBufferingTime: (time: number) => void;
    notifyPerformanceStats: (ping: number, vol: number, perf: number[]) => void;
    notifyException: (code: VOICE_CHANGER_CLIENT_EXCEPTION, message: string) => void;
};
export declare class VoiceChangerWorkletNode extends AudioWorkletNode {
    private listener;
    private setting;
    private requestChunks;
    private chunkCounter;
    private socket;
    private bufferStart;
    private isOutputRecording;
    private recordingOutputChunk;
    private outputNode;
    private startPromiseResolve;
    private stopPromiseResolve;
    constructor(context: AudioContext, listener: VoiceChangerWorkletListener);
    setOutputNode: (outputNode: VoiceChangerWorkletNode | null) => void;
    updateSetting: (setting: WorkletNodeSetting) => void;
    getSettings: () => WorkletNodeSetting;
    getSocketId: () => string | undefined;
    createSocketIO: () => void;
    postReceivedVoice: (u8data: Uint8Array) => void;
    handleMessage(event: any): void;
    private sendBuffer;
    configure: (_: WorkletSetting) => void;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    trancateBuffer: () => void;
    startOutputRecording: () => void;
    stopOutputRecording: () => Float32Array;
}
