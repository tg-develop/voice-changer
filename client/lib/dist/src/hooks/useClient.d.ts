import { IndexedDBStateAndMethod } from "./useIndexedDB";
import { ServerSettingState } from "./useServerSetting";
import { ClientSetting, VoiceChangerClientSetting, WorkletNodeSetting, WorkletSetting } from "../const";
export type UseClientProps = {
    audioContext: AudioContext | null;
};
export type ClientState = {
    initialized: boolean;
    setting: ClientSetting;
    setVoiceChangerClientSetting: (_voiceChangerClientSetting: VoiceChangerClientSetting) => void;
    setServerUrl: (url: string) => void;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    reloadClientSetting: () => Promise<void>;
    setWorkletNodeSetting: (_workletNodeSetting: WorkletNodeSetting) => void;
    startOutputRecording: () => void;
    stopOutputRecording: () => Promise<Float32Array>;
    trancateBuffer: () => Promise<void>;
    setWorkletSetting: (_workletSetting: WorkletSetting) => void;
    serverSetting: ServerSettingState;
    indexedDBState: IndexedDBStateAndMethod;
    bufferingTime: number;
    performance: PerformanceStats;
    getInfo: () => Promise<void>;
    clearSetting: () => Promise<void>;
    setAudioOutputElementId: (elemId: string) => void;
    setAudioMonitorElementId: (elemId: string) => void;
    errorMessage: string;
    resetErrorMessage: () => void;
};
export type PerformanceStats = {
    vol: number;
    responseTime: number;
    preprocessTime: number;
    mainprocessTime: number;
    postprocessTime: number;
};
export declare const useClient: (props: UseClientProps) => ClientState;
