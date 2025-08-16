import { WorkletSetting } from "../const";
import { VoiceChangerClient } from "../VoiceChangerClient";
export type UseWorkletSettingProps = {
    voiceChangerClient: VoiceChangerClient | null;
    workletSetting: WorkletSetting;
};
export type WorkletSettingState = {
    setting: WorkletSetting;
    _setSetting: (setting: WorkletSetting) => void;
};
export declare const useWorkletSetting: (props: UseWorkletSettingProps) => WorkletSettingState;
