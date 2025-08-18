import { JSX, useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import DragHandle from '../Helpers/DragHandle';
import { CSS_CLASSES } from '../../styles/constants';
import { AudioEffect, AudioChannel, AudioEffectsConfiguration } from '@dannadori/voice-changer-client-js';
import { createEffectFromServerSchema, getAvailableEffectTypesFromServer } from './serverEffectsUtils';
import EffectsList, { AudioEffectWithIndex as CEffect } from './EffectsList';
import EffectConfig from './EffectConfig';
import { useAppState } from '../../context/AppContext';
import BackgroundConfig, { BackgroundTrack } from './BackgroundConfig';
import BackgroundList from './BackgroundList';

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
      const serverUrl = (appState as any).voiceChangerClient?.configurator?.restClient?.serverUrl ||
                        (serverSetting as any).voiceChangerClient?.configurator?.restClient?.serverUrl ||
                        window.location.origin;
      const formData = new FormData();
      formData.append('key', 'audioEffects');
      formData.append('val', JSON.stringify(effectsConfig));
      const response = await fetch(`${serverUrl}/update_settings`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      await response.json();
      if (serverSetting?.reloadServerInfo) await serverSetting.reloadServerInfo();
    } catch (error) {
      console.error('Failed to update server effects:', error);
      await syncWithServer();
    } finally {
      setIsLoading(false);
    }
  }, [appState, serverSetting, isLoading, syncWithServer]);

  const updateServerBackgrounds = useCallback(async (newTracks: BackgroundTrack[]) => {
    if (!appState || isLoading) return;
    setIsLoading(true);
    try {
      const payload = newTracks.map(t => ({
        name: t.name,
        enabled: t.enabled,
        gainDb: t.gainDb,
        mode: t.mode,
        loopPauseSec: t.loopPauseSec ?? 0,
        random: t.random ? {
          minPauseSec: t.random.minPauseSec ?? 2,
          maxPauseSec: t.random.maxPauseSec ?? 5,
        } : undefined,
        filename: (t as any).filename || '',
      }));
      const serverUrl = (appState as any).voiceChangerClient?.configurator?.restClient?.serverUrl ||
                        (serverSetting as any).voiceChangerClient?.configurator?.restClient?.serverUrl ||
                        window.location.origin;
      const formData = new FormData();
      formData.append('key', 'audioBackgrounds');
      formData.append('val', JSON.stringify(payload));
      const response = await fetch(`${serverUrl}/update_settings`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      await response.json();
      if (serverSetting?.reloadServerInfo) await serverSetting.reloadServerInfo();
    } catch (e) {
      console.error('Failed to update background tracks:', e);
    } finally {
      setIsLoading(false);
    }
  }, [appState, serverSetting, isLoading]);

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
            {/* Removed syncing badge to avoid slider overlap */}
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
          {/* Left Panel - Effects or Background List */}
          <div className="w-1/2 pr-3 border-r border-slate-200 dark:border-gray-600">
            {/* Local Tabs above lists only */}
            <div className="flex mb-3 bg-slate-100 dark:bg-gray-700 rounded-md p-1">
              {(['input','output','background'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                    activeTab === tab
                      ? 'bg-white dark:bg-gray-600 text-slate-700 dark:text-gray-200 shadow-sm'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span className="capitalize">{tab}</span>
                  </div>
                </button>
              ))}
            </div>
            {activeTab === 'background' ? (
              <BackgroundList
                tracks={bgTracks}
                selectedId={selectedBgId}
                onSelect={setSelectedBgId}
                onAddFiles={(files) => {
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
                  updateServerBackgrounds(updated);
                }}
                onDelete={(id) => {
                  const filtered = bgTracks.filter(t => t.id !== id).map((t, i) => ({ ...t, order: i }));
                  setBgTracks(filtered);
                  if (selectedBgId === id) setSelectedBgId(null);
                  updateServerBackgrounds(filtered);
                }}
                onToggle={(id) => {
                  const updated = bgTracks.map(t => (t.id === id ? { ...t, enabled: !t.enabled } : t));
                  setBgTracks(updated);
                  updateServerBackgrounds(updated);
                }}
                onReorder={(tracks) => { setBgTracks(tracks); updateServerBackgrounds(tracks); }}
              />
            ) : (
              <EffectsList
                channel={activeTab}
                effects={(activeTab === 'input' ? inputEffects : outputEffects) as unknown as CEffect[]}
                selectedEffectIndex={selectedEffectIndex}
                onEffectSelect={handleEffectSelect}
                onEffectAdd={handleEffectAdd}
                onEffectDelete={handleEffectDelete}
                onEffectToggle={handleEffectToggle}
                onEffectReorder={(reorderedChannel) => {
                  const other = effects.filter(e => e.channel !== activeTab);
                  const all = [...other, ...reorderedChannel];
                  const reindexed = all.map((e, i) => ({ ...e, index: i }));
                  setEffects(reindexed);
                  updateServerEffects(reindexed);
                }}
                serverSchema={serverSetting?.serverSetting?.audioEffectsSchema}
                providersInfo={serverSetting?.serverSetting?.audioEffectsProviders}
              />
            )}
          </div>
          
          {/* Right Panel - Effect Configuration */}
          <div className="w-1/2 pl-3">
            {activeTab !== 'background' ? (
              <EffectConfig
                effect={(selectedEffect && (effects.find(e => e.index === selectedEffectIndex && e.channel === activeTab) || null)) as any}
                onParameterChange={handleParameterChange}
                serverSchema={serverSetting?.serverSetting?.audioEffectsSchema}
              />
            ) : (
              <BackgroundConfig
                track={bgTracks.find(t => t.id === selectedBgId) || null}
                onChange={(updated) => {
                  const newList = bgTracks.map(t => (t.id === updated.id ? updated : t));
                  setBgTracks(newList);
                  updateServerBackgrounds(newList);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioEffectsCard;
