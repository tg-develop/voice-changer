import { VoiceChangerClientSetting } from "../const";
import { VoiceChangerClient } from "../VoiceChangerClient";
export type UseClientSettingProps = {
    voiceChangerClient: VoiceChangerClient | null;
    voiceChangerClientSetting: VoiceChangerClientSetting;
};
export type ClientSettingState = {
    setServerUrl: (url: string) => void;
    start: () => Promise<void>;
    stop: () => Promise<void>;
    reloadClientSetting: () => Promise<void>;
};
export declare const useClientSetting: (props: UseClientSettingProps) => ClientSettingState;
