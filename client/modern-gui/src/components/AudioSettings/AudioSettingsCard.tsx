import { JSX, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import DragHandle from '../Helpers/DragHandle';
import { AUDIO_KEYS, CSS_CLASSES } from '../../styles/constants';
import AudioMode from './AudioMode';
import AudioDevicesServer from './AudioDevicesServer';
import AudioVolume from './AudioVolume';
import AudioDevicesClient from './AudioDevicesClient';
import { useAppState } from '../../context/AppContext';

interface AudioSettingsCardProps {
  dndAttributes?: Record<string, any>;
  dndListeners?: Record<string, any>;
}

function AudioSettingsCard({ dndAttributes, dndListeners }: AudioSettingsCardProps): JSX.Element {
  // ---------------- States ----------------
  const appState = useAppState();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [audioState, setAudioState] = useState<"client" | "server">("client")

  // ---------------- Hooks ----------------

  // Set audio state based on server audio setting
  useEffect(() => {
    if (appState.serverSetting.serverSetting.enableServerAudio == 1) {
      setAudioState("server")
    } else {
      setAudioState("client")
    }
  }, [appState.serverSetting.serverSetting.enableServerAudio]);

  // ---------------- Render ----------------

  return (
    <div className={`p-4 border border-slate-200 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 transition-all duration-300 flex-1 min-h-0 flex flex-col ${isCollapsed ? 'h-auto' : 'overflow-y-auto'}`}>
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center">
          <h4 className={CSS_CLASSES.heading}>Audio Settings</h4>
        </div>
        <div className="flex space-x-1 items-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={CSS_CLASSES.iconButton}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} className="h-5 w-5" />
          </button>
          <DragHandle attributes={dndAttributes} listeners={dndListeners} title="Drag" />
        </div>
      </div>
      {!isCollapsed && (
        <>
          <AudioMode audioState={audioState} setAudioState={setAudioState} />
          {audioState === "client" ? <AudioDevicesClient /> : <AudioDevicesServer />}
          <div className="mt-6">
            <AudioVolume />
          </div>
        </>
      )}
      <audio hidden id={AUDIO_KEYS.AUDIO_ELEMENT_FOR_PLAY_RESULT}></audio>
      <audio hidden id={AUDIO_KEYS.AUDIO_ELEMENT_FOR_PLAY_MONITOR}></audio>
    </div>
  );
}

export default AudioSettingsCard; 