import { ClientState } from "@dannadori/voice-changer-client-js";
import React, { useContext, useEffect, useRef } from "react";
import { ReactNode } from "react";
import { useVCClient } from "../scripts/useVCClient";
import { useAppRoot } from "./AppRootProvider";

type Props = {
    children: ReactNode;
};

export type AppContextValue = ClientState & {
    audioContext: AudioContext;
    initializedRef: React.MutableRefObject<boolean>;
};

// Create context
const AppStateContext = React.createContext<AppContextValue | null>(null);

// Create hook
export const useAppState = (): AppContextValue => {
    const state = useContext(AppStateContext);
    if (!state) {
        throw new Error("useAppState must be used within AppContextProvider");
    }
    return state;
};

// Create provider
export const AppContextProvider = ({ children }: Props) => {
    // Get audio context and setup client
    const appRoot = useAppRoot();
    const clientState = useVCClient({ audioContext: appRoot.audioContextState.audioContext });
    const initializedRef = useRef<boolean>(false);

    // Set initialized flag of the client
    useEffect(() => {
        if (clientState.clientState.initialized) {
            initializedRef.current = true;
            clientState.clientState.getInfo();
        }
    }, [clientState.clientState.initialized]);

    // Provide app state
    const providerValue: AppContextValue = {
        audioContext: appRoot.audioContextState.audioContext!,
        ...clientState.clientState,
        initializedRef,
    };

    return <AppStateContext.Provider value={providerValue}>{children}</AppStateContext.Provider>;
};