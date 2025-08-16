import React, { createContext, ReactNode, useContext, useState, useRef, useCallback, useEffect } from 'react';
import LoadingScreen from '../components/Modals/LoadingScreen';
import ErrorNotifications from '../components/Modals/ErrorNotifications';
import { useAppState } from './AppContext';

type ErrorType = 'Error' | 'Warning' | 'Confirm';

interface UIError {
  id: number;
  message: string;
  type: ErrorType;
}

export interface UIContextType {
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  showError: (message: string, type?: ErrorType) => void;
  setIsConverting: (isConverting: boolean) => void;
  isConverting: boolean;

  reloadDeviceInfo: () => Promise<void>;
  inputAudioDeviceInfo: MediaDeviceInfo[];
  outputAudioDeviceInfo: MediaDeviceInfo[];
  audioInputForGUI: string;
  audioOutputForGUI: string;
  audioMonitorForGUI: string;
  audioOutputForAnalyzer: string;
  setAudioInputForGUI: (audioInputForGUI: string) => void;
  setAudioOutputForGUI: (audioOutputForGUI: string) => void;
  setAudioMonitorForGUI: (audioMonitorForGUI: string) => void;
  setAudioOutputForAnalyzer: (audioOutputForAnalyzer: string) => void;
}

// Create context
const UIContext = createContext<UIContextType | undefined>(undefined);

// Create hook
export const useUIContext = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within a UIContextProvider');
  }
  return context;
};

// Create provider
export const UIContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ---------------- States ----------------
  const appState = useAppState();

  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [inputAudioDeviceInfo, setInputAudioDeviceInfo] = useState<MediaDeviceInfo[]>([]);
  const [outputAudioDeviceInfo, setOutputAudioDeviceInfo] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputForAnalyzer, setAudioOutputForAnalyzer] = useState<string>("none");
  const [audioInputForGUI, setAudioInputForGUI] = useState<string>("none");
  const [audioOutputForGUI, setAudioOutputForGUI] = useState<string>("none");
  const [audioMonitorForGUI, setAudioMonitorForGUI] = useState<string>("none");

  const [loadingMessage, setLoadingMessage] = useState<string>();
  const [errors, setErrors] = useState<UIError[]>([]);
  const idRef = useRef(0);

  // ---------------- Functions ----------------

  // Start loading screen
  const startLoading = useCallback((message?: string) => {
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  // Stop loading screen
  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(undefined);
  }, []);

  // Show error toast (top right)
  const showError = useCallback((message: string, type: ErrorType = 'Error') => {
    idRef.current += 1;
    const id = idRef.current;
    setErrors(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setErrors(prev => prev.filter(err => err.id !== id));
    }, 5000);
  }, []);

  // Remove error toast
  const removeError = useCallback((id: number) => {
    setErrors(prev => prev.filter(err => err.id !== id));
  }, []);

  // Check if device is available
  const checkDeviceAvailable = useRef<boolean>(false);

  // Reload device list
  const _reloadDeviceInfo = async () => {
    // Check if device is available
    if (checkDeviceAvailable.current == false) {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        ms.getTracks().forEach((x) => {
          x.stop();
        });
        checkDeviceAvailable.current = true;
      } catch (e) {
        console.warn("Enumerate device error:", e);
      }
    }

    // Enumerate devices
    const mediaDeviceInfos = await navigator.mediaDevices.enumerateDevices();

    // Get audio input devices
    const audioInputs = mediaDeviceInfos.filter((x) => {
      return x.kind == "audioinput";
    });

    // Get audio output devices
    const audioOutputs = mediaDeviceInfos.filter((x) => {
      return x.kind == "audiooutput";
    });

    return [audioInputs, audioOutputs];
  };

  // Reload device list and update state
  const reloadDeviceInfo = async () => {
    const audioInfo = await _reloadDeviceInfo();
    setInputAudioDeviceInfo(audioInfo[0]);
    setOutputAudioDeviceInfo(audioInfo[1]);
  };

  // ---------------- Hooks ----------------

  // Check if server is running (needed if page is reloaded and servermode still enabled)
  useEffect(() => {
    if (appState.serverSetting.serverSetting.serverAudioStated == 1) {
      setIsConverting(true);
    }
  }, [appState.serverSetting.serverSetting.serverAudioStated]);

  // Poll devices
  useEffect(() => {
    let isMounted = true;

    // Poll devices
    const pollDevices = async () => {
      // Check if device list changed
      const checkDeviceDiff = (knownDeviceIds: Set<string>, newDeviceIds: Set<string>) => {
        const deleted = new Set([...knownDeviceIds].filter((x) => !newDeviceIds.has(x)));
        const added = new Set([...newDeviceIds].filter((x) => !knownDeviceIds.has(x)));
        return { deleted, added };
      };
      
      try {
        // Reload device list
        const audioInfo = await _reloadDeviceInfo();

        const knownAudioinputIds = new Set(inputAudioDeviceInfo.map((x) => x.deviceId));
        const newAudioinputIds = new Set(audioInfo[0].map((x) => x.deviceId));

        const knownAudiooutputIds = new Set(outputAudioDeviceInfo.map((x) => x.deviceId));
        const newAudiooutputIds = new Set(audioInfo[1].map((x) => x.deviceId));

        // Check if device list changed
        const audioInputDiff = checkDeviceDiff(knownAudioinputIds, newAudioinputIds);
        const audioOutputDiff = checkDeviceDiff(knownAudiooutputIds, newAudiooutputIds);

        // Update device list if changed
        if (audioInputDiff.deleted.size > 0 || audioInputDiff.added.size > 0) {
          console.log(`deleted input device: ${[...audioInputDiff.deleted]}`);
          console.log(`added input device: ${[...audioInputDiff.added]}`);
          setInputAudioDeviceInfo(audioInfo[0]);
        }

        if (audioOutputDiff.deleted.size > 0 || audioOutputDiff.added.size > 0) {
          console.log(`deleted output device: ${[...audioOutputDiff.deleted]}`);
          console.log(`added output device: ${[...audioOutputDiff.added]}`);
          setOutputAudioDeviceInfo(audioInfo[1]);
        }

        // Poll devices every 3 seconds
        if (isMounted) {
          setTimeout(pollDevices, 1000 * 3);
        }
      } catch (err) {
        console.error("An error occurred during enumeration of devices:", err);
      }
    };

    pollDevices();

    return () => {
      isMounted = false;
    };
  }, [inputAudioDeviceInfo, outputAudioDeviceInfo]);

  // ---------------- Render ----------------

  return (
    <UIContext.Provider value={{
      startLoading, stopLoading, showError, setIsConverting, reloadDeviceInfo,
      isConverting, setAudioInputForGUI, setAudioOutputForGUI, setAudioMonitorForGUI,
      inputAudioDeviceInfo, outputAudioDeviceInfo, audioInputForGUI, audioOutputForGUI, audioMonitorForGUI, audioOutputForAnalyzer, setAudioOutputForAnalyzer
    }}>
      {children}
      {isLoading && <LoadingScreen message={loadingMessage} />}
      <ErrorNotifications errors={errors} removeError={removeError} />
    </UIContext.Provider>
  );
};
