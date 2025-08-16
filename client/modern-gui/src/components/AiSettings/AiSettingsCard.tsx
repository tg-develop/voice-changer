import { JSX, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import DragHandle from '../Helpers/DragHandle';
import { useAppState } from '../../context/AppContext';
import { useUIContext } from '../../context/UIContext';
import { useIndexedDB } from '@dannadori/voice-changer-client-js';
import { CSS_CLASSES } from '../../styles/constants';
import { useAppRoot } from '../../context/AppRootProvider';
import NoiseReduction from './NoiseReduction';
import F0Extraction from './F0Extraction';
import ChunkConfig from './ChunkConfig';
import SilentThreshold from './SilentThreshold';
import GPUConfig from './GpuConfig';
import ServerIO from './ServerIO';

interface AiSettingsCardProps {
  dndAttributes?: Record<string, any>;
  dndListeners?: Record<string, any>;
}

function AiSettingsCard({ dndAttributes, dndListeners }: AiSettingsCardProps): JSX.Element {
  // ---------------- States ----------------
  const appState = useAppState();
  const uiState = useUIContext();
  const { appGuiSettingState } = useAppRoot();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const { getItem, setItem } = useIndexedDB({ clientType: null });

  // ---------------- Render ----------------

  return (
    <div className={`p-4 border border-slate-200 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 transition-all duration-300 flex-1 min-h-0 flex flex-col ${isCollapsed ? 'h-auto' : 'overflow-y-auto'}`}>
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-gray-700">
        <h4 className={CSS_CLASSES.heading}>AI Settings</h4>
        <div className="flex space-x-1 items-center">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={CSS_CLASSES.iconButton} title={isCollapsed ? "Expand" : "Collapse"}>
            <FontAwesomeIcon icon={isCollapsed ? faChevronDown : faChevronUp} className="h-5 w-5" />
          </button>
          <DragHandle attributes={dndAttributes} listeners={dndListeners} title="Drag" />
        </div>
      </div>
      {!isCollapsed && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="space-y-3">
            <NoiseReduction
              appState={appState}
              getItem={getItem}
              setItem={setItem}
            />
            <SilentThreshold
              appState={appState}
              uiState={uiState}
            />
          </div>
          <div className="space-y-3">
            <ChunkConfig
              appState={appState}
              uiState={uiState}
            />

            <GPUConfig
              appState={appState}
              uiState={uiState}
            />

            <div>
              <F0Extraction
                appState={appState}
                uiState={uiState}
                appGuiSettingState={appGuiSettingState}
              />
            </div>
          </div>
        </div>
      )}
      {!isCollapsed && (
        <ServerIO appState={appState} />
      )}
    </div>
  );
}

export default AiSettingsCard; 