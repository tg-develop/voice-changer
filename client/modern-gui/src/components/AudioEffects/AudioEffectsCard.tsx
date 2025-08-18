import { JSX, useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import DragHandle from '../Helpers/DragHandle';
import { CSS_CLASSES } from '../../styles/constants';
import { AudioEffect, AudioChannel, AudioEffectsConfiguration } from '@dannadori/voice-changer-client-js';
import { createEffectFromServerSchema, getAvailableEffectTypesFromServer } from './serverEffectsUtils';
import EffectsList from './EffectsList';
import EffectConfig from './EffectConfig';
import { useAppState } from '../../context/AppContext';
import BackgroundConfig, { BackgroundTrack } from './BackgroundConfig';

// UI type with index for client-side management
type AudioEffectWithIndex = AudioEffect & { index: number };

interface AudioEffectsCardProps {
  dndAttributes?: Record<string, any>;
  dndListeners?: Record<string, any>;
}

function AudioEffectsCard({ dndAttributes, dndListeners }: AudioEffectsCardProps): JSX.Element {
  // ---------------- App State ----------------
  const appState = useAppState();
  const { serverSetting } = appState;
  
  // ---------------- States ----------------
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [effects, setEffects] = useState<AudioEffectWithIndex[]>([]);
  const [selectedEffectIndex, setSelectedEffectIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Background state
  const [bgTracks, setBgTracks] = useState<BackgroundTrack[]>([]);
  const [selectedBgId, setSelectedBgId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'output' | 'background'>('output');

  // Load/Save background tracks to localStorage
  const LS_KEY = 'vc_background_tracks_v1';
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setBgTracks(parsed);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(bgTracks));
    } catch {}
  }, [bgTracks]);

  // ---------------- Server Sync Functions ----------------
  
  const syncWithServer = useCallback(async () => {
    if (!serverSetting?.serverSetting?.audioEffects) return;
    
    const serverEffects = serverSetting.serverSetting.audioEffects;
    const effectsArray = serverEffects.map((effect, index) => ({
      ...effect,
      index
    }));
    setEffects(effectsArray);
  }, [serverSetting?.serverSetting?.audioEffects]);

  const updateServerEffects = useCallback(async (newEffects: AudioEffectWithIndex[]) => {
    if (!appState || isLoading) return;
    
    setIsLoading(true);
    try {
      const effectsConfig: AudioEffectsConfiguration = newEffects.map(effect => {
        const { index, ...effectData } = effect;
        return effectData;
      });
      
      // Direct API call to update audio effects
      const serverUrl = (appState as any).voiceChangerClient?.configurator?.restClient?.serverUrl || 
                       (serverSetting as any).voiceChangerClient?.configurator?.restClient?.serverUrl ||
                       window.location.origin;
      
      const formData = new FormData();
      formData.append('key', 'audioEffects');
      formData.append('val', JSON.stringify(effectsConfig));
      
      const response = await fetch(`${serverUrl}/update_settings`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      await response.json();
      
      // Reload server info to get updated state
      if (serverSetting?.reloadServerInfo) {
        await serverSetting.reloadServerInfo();
      }
    } catch (error) {
      console.error('Failed to update server effects:', error);
      // Revert to server state on error
      await syncWithServer();
    } finally {
      setIsLoading(false);
    }
  }, [appState, serverSetting, isLoading, syncWithServer]);

  // ---------------- Effects ----------------
  
  useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);

  // ---------------- Functions ----------------

  const handleEffectAdd = async (effectType: string, channel: AudioChannel) => {
    const newEffect = createEffectFromServerSchema(effectType, channel, serverSetting?.serverSetting?.audioEffectsSchema);
    const newIndex = effects.length;
    const newEffectWithIndex = { ...newEffect, index: newIndex };

    const updatedEffects = [...effects, newEffectWithIndex];
    setEffects(updatedEffects);
    setSelectedEffectIndex(newIndex);
    
    await updateServerEffects(updatedEffects);
  };

  const handleEffectDelete = async (effectIndex: number) => {
    const updatedEffects = effects
      .filter((_, index) => index !== effectIndex)
      .map((effect, newIndex) => ({ ...effect, index: newIndex }));
    
    setEffects(updatedEffects);

    if (selectedEffectIndex === effectIndex) {
      setSelectedEffectIndex(null);
    } else if (selectedEffectIndex !== null && selectedEffectIndex > effectIndex) {
      setSelectedEffectIndex(selectedEffectIndex - 1);
    }
    
    await updateServerEffects(updatedEffects);
  };

  const handleEffectSelect = (effectIndex: number) => {
    setSelectedEffectIndex(effectIndex);
  };

  const handleEffectToggle = async (effectIndex: number) => {
    const updatedEffects = effects.map((effect, index) => 
      index === effectIndex 
        ? { ...effect, enabled: !effect.enabled }
        : effect
    );
    
    setEffects(updatedEffects);
    await updateServerEffects(updatedEffects);
  };

  const handleEffectReorder = async (reorderedEffects: AudioEffectWithIndex[]) => {
    const reindexedEffects = reorderedEffects.map((effect, index) => ({ ...effect, index }));
    setEffects(reindexedEffects);
    await updateServerEffects(reindexedEffects);
  };

  const handleParameterChange = async (effectIndex: number, parameterKey: string, value: number | boolean | string) => {
    const updatedEffects = effects.map((effect, index) => 
      index === effectIndex 
        ? {
            ...effect,
            parameters: {
              ...effect.parameters,
              [parameterKey]: value
            }
          }
        : effect
    );
    
    setEffects(updatedEffects);
    await updateServerEffects(updatedEffects);
  };

  const selectedEffect = selectedEffectIndex !== null ? effects[selectedEffectIndex] || null : null;

  // Count effects by channel and enabled status
  const inputEffects = effects.filter(e => e.channel === 'input');
  const outputEffects = effects.filter(e => e.channel === 'output');
  const enabledInputEffects = inputEffects.filter(e => e.enabled).length;
  const enabledOutputEffects = outputEffects.filter(e => e.enabled).length;
  const totalActiveEffects = enabledInputEffects + enabledOutputEffects;
  const totalActiveBackground = bgTracks.filter(t => t.enabled).length;

  // ---------------- Render ----------------

  return (
    <div className={`p-4 border border-slate-200 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 transition-all duration-300 flex-1 min-h-0 flex flex-col ${isCollapsed ? 'h-auto' : 'overflow-hidden'} ${isLoading ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <h4 className={CSS_CLASSES.heading}>Audio Effects</h4>
          <div className="flex items-center space-x-2">
            {isLoading && (
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 text-xs rounded-full">
                Syncing...
              </span>
            )}
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs rounded-full">
              {totalActiveEffects} Effects
            </span>
            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 text-xs rounded-full">
              {totalActiveBackground} Background Tracks
            </span>
          </div>
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
        <div className="flex-1 min-h-0 flex">
          {/* Left Panel - Effects List */}
          <div className="w-1/2 pr-3 border-r border-slate-200 dark:border-gray-600">
            <EffectsList
              effects={effects}
              selectedEffectIndex={selectedEffectIndex}
              onEffectSelect={handleEffectSelect}
              onEffectAdd={handleEffectAdd}
              onEffectDelete={handleEffectDelete}
              onEffectToggle={handleEffectToggle}
              onEffectReorder={handleEffectReorder}
              serverSchema={serverSetting?.serverSetting?.audioEffectsSchema}
              providersInfo={serverSetting?.serverSetting?.audioEffectsProviders}
              // Background integration
              backgroundTracks={bgTracks}
              selectedBackgroundId={selectedBgId}
              onBackgroundSelect={setSelectedBgId}
              onBackgroundAddFiles={(files) => {
                const startOrder = bgTracks.length;
                const newTracks: BackgroundTrack[] = [];
                Array.from(files).forEach((file, idx) => {
                  const id = `${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 8)}`;
                  const url = URL.createObjectURL(file);
                  newTracks.push({
                    id,
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    fileName: file.name,
                    url,
                    enabled: true,
                    gainDb: -6,
                    mode: 'loop',
                    loop: true,
                    loopPauseSec: 0,
                    order: startOrder + idx,
                  });
                });
                const updated = [...bgTracks, ...newTracks];
                setBgTracks(updated);
                if (newTracks.length > 0) setSelectedBgId(newTracks[0].id);
              }}
              onBackgroundDelete={(id) => {
                const filtered = bgTracks.filter(t => t.id !== id).map((t, i) => ({ ...t, order: i }));
                setBgTracks(filtered);
                if (selectedBgId === id) setSelectedBgId(null);
              }}
              onBackgroundToggle={(id) => {
                setBgTracks(prev => prev.map(t => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
              }}
              onBackgroundReorder={(tracks) => setBgTracks(tracks)}
              onActiveTabChange={(tab) => setActiveTab(tab)}
            />
          </div>
          
          {/* Right Panel - Effect Configuration */}
          <div className="w-1/2 pl-3">
            {activeTab !== 'background' ? (
              <EffectConfig
                effect={selectedEffect}
                onParameterChange={handleParameterChange}
                serverSchema={serverSetting?.serverSetting?.audioEffectsSchema}
              />
            ) : (
              <BackgroundConfig
                track={bgTracks.find(t => t.id === selectedBgId) || null}
                onChange={(updated) => setBgTracks(prev => prev.map(t => (t.id === updated.id ? updated : t)))}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioEffectsCard;
