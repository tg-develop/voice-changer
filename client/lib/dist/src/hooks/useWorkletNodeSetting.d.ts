import { WorkletNodeSetting } from "../const";
import { VoiceChangerClient } from "../VoiceChangerClient";
export type UseWorkletNodeSettingProps = {
    voiceChangerClient: VoiceChangerClient | null;
    workletNodeSetting: WorkletNodeSetting;
};
export type WorkletNodeSettingState = {
    startOutputRecording: () => void;
    stopOutputRecording: () => Promise<Float32Array>;
    trancateBuffer: () => Promise<void>;
};
export declare const useWorkletNodeSetting: (props: UseWorkletNodeSettingProps) => WorkletNodeSettingState;
