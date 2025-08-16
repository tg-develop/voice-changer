import { createContext, useContext, ReactNode } from "react";
import { AppGuiSettingState, useAppGuiSetting } from "../scripts/useAppGuiSetting";
import { AudioConfigState, useAudioConfig } from "../scripts/useAudioConfig";

interface AppRootProviderProps {
    children: ReactNode;
};

export interface AppRootValue {
    audioContextState: AudioConfigState;
    appGuiSettingState: AppGuiSettingState;
};

// Create context
const AppRootContext = createContext<AppRootValue | null>(null);

// Create hook
export const useAppRoot = (): AppRootValue => {
    const context = useContext(AppRootContext);
    if (!context) {
        throw new Error("useAppRoot must be used within an AppRootProvider");
    }
    return context;
};

// Create provider
export const AppRootProvider = ({ children }: AppRootProviderProps) => {
    // Get audio context and app gui setting
    const audioContextState = useAudioConfig();
    const appGuiSettingState = useAppGuiSetting();

    const providerValue: AppRootValue = {
        audioContextState,
        appGuiSettingState,
    };

    return <AppRootContext.Provider value={providerValue}>{children}</AppRootContext.Provider>;
}; 