import { JSX, useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faStop, faMicrophone, faVolumeUp, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { AUDIO_KEYS, CSS_CLASSES } from '../../styles/constants';
import { ClientState } from "@dannadori/voice-changer-client-js";
import AudioPlayer from '../Helpers/AudioPlayer';
import { useUIContext } from '../../context/UIContext';

interface ServerIOProps {
  appState: ClientState;
}

function ServerIO({ appState }: ServerIOProps): JSX.Element {
  // ---------------- States ----------------
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { audioOutputForAnalyzer, setAudioOutputForAnalyzer, outputAudioDeviceInfo, isConverting } = useUIContext();
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>('');
  const recordingStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------- Hooks ----------------

  // Auto-stop recording when isConverting becomes false
  useEffect(() => {
    if (!isConverting && isRecording) {
      onServerIORecordStop();
    }
  }, [isConverting, isRecording]);

  // Recording duration timer
  useEffect(() => {
    if (isRecording) {
      recordingStartTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        if (recordingStartTimeRef.current) {
          const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          setRecordingDuration(elapsed);
        }
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      setRecordingDuration(0);
      recordingStartTimeRef.current = null;
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRecording]);

  // ---------------- Functions ----------------

  // Record start
  const onServerIORecordStart = async () => {
    setIsRecording(true);
    await appState.serverSetting.updateServerSettings({ ...appState.serverSetting.serverSetting, recordIO: 1 });
  };

  // Record stop
  const onServerIORecordStop = async () => {
    setIsRecording(false);
    await appState.serverSetting.updateServerSettings({ ...appState.serverSetting.serverSetting, recordIO: 0 });

    // Trigger reload of audio files by updating src with timestamp
    const timestamp = new Date().getTime();
    const wavInput = document.getElementById(AUDIO_KEYS.AUDIO_ELEMENT_FOR_SAMPLING_INPUT) as HTMLAudioElement;
    const wavOutput = document.getElementById(AUDIO_KEYS.AUDIO_ELEMENT_FOR_SAMPLING_OUTPUT) as HTMLAudioElement;

    if (wavInput) {
      wavInput.src = "/tmp/in.wav?" + timestamp;
      wavInput.load();
    }

    if (wavOutput) {
      wavOutput.src = "/tmp/out.wav?" + timestamp;
      wavOutput.load();
    }
  }

  // Format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ---------------- Handlers ----------------

  // Handle recording toggle
  const handleRecordingToggle = async () => {
    if (isRecording) {
      onServerIORecordStop();
    } else {
      onServerIORecordStart();
    }
  };

  // Handle output device change
  const handleOutputDeviceChange = (deviceId: string) => {
    setSelectedOutputDevice(deviceId);
    setAudioOutputForAnalyzer(deviceId);
  }

  // ---------------- Render ----------------

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h5 className="text-md font-medium text-slate-700 dark:text-gray-200">
          <FontAwesomeIcon icon={faMicrophone} className="mr-2" />
          ServerIO Analyzer
        </h5>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={CSS_CLASSES.iconButton}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} className="h-4 w-4" />
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRecordingToggle}
            disabled={!isConverting}
            className={`flex items-center px-3 py-1.5 text-sm rounded transition-colors duration-150 ${!isConverting
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            <FontAwesomeIcon
              icon={isRecording ? faStop : faPlay}
              className="mr-1.5 text-xs"
            />
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>

          {isRecording && (
            <div className="flex items-center text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-xs">Recording... {formatDuration(recordingDuration)}</span>
            </div>
          )}
        </div>

        {/* Output Device Selection */}
        <div>
          <label className={CSS_CLASSES.label}>
            <FontAwesomeIcon icon={faVolumeUp} className="mr-2" />
            Output Device:
          </label>
          <select
            value={selectedOutputDevice}
            onChange={(e) => handleOutputDeviceChange(e.target.value)}
            className={CSS_CLASSES.select}
          >
            {outputAudioDeviceInfo.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Output Device ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>

        {/* Audio Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input Audio */}
          <div>
            <label className={CSS_CLASSES.label}>Input Audio:</label>
            <AudioPlayer
              src="/tmp/in.wav"
              title="Input Audio"
              id={AUDIO_KEYS.AUDIO_ELEMENT_FOR_SAMPLING_INPUT}
              outputDeviceId={audioOutputForAnalyzer}
              modelName={appState.serverSetting.serverSetting.modelSlotIndex !== undefined
                ? appState.serverSetting.serverSetting.modelSlots[appState.serverSetting.serverSetting.modelSlotIndex]?.name || 'Unknown'
                : 'Unknown'}
              audioType="Input"
            />
          </div>

          {/* Output Audio */}
          <div>
            <label className={CSS_CLASSES.label}>Output Audio:</label>
            <AudioPlayer
              src="/tmp/out.wav"
              title="Output Audio"
              id={AUDIO_KEYS.AUDIO_ELEMENT_FOR_SAMPLING_OUTPUT}
              outputDeviceId={audioOutputForAnalyzer}
              modelName={appState.serverSetting.serverSetting.modelSlotIndex !== undefined
                ? appState.serverSetting.serverSetting.modelSlots[appState.serverSetting.serverSetting.modelSlotIndex]?.name || 'Unknown'
                : 'Unknown'}
              audioType="Output"
            />
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

export default ServerIO;