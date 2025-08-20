import { JSX, useEffect, useState } from 'react';
import { CSS_CLASSES } from '../../styles/constants';
import DebouncedSlider from '../Helpers/DebouncedSlider';
import AudioPlayer from '../Helpers/AudioPlayer';
import { BackgroundTrack } from '@dannadori/voice-changer-client-js';

type BackgroundConfigProps = {
  track: BackgroundTrack | null;
  onChange: (id: string, key: string, value: any) => void;
};

function BackgroundConfig({ track, onChange }: BackgroundConfigProps): JSX.Element {
  const [local, setLocal] = useState<BackgroundTrack | null>(track);
  const [displayGain, setDisplayGain] = useState<number>(track?.gainDb ?? -6);

  useEffect(() => {
    setLocal(track);
    if (track) setDisplayGain(track.gainDb);
  }, [track]);

  const handle = (key: keyof Omit<BackgroundTrack, 'id'>, value: any) => {
    if (!local) return;
    const updated = { ...local, [key]: value } as BackgroundTrack;
    setLocal(updated);
    onChange(local.id, key, value);
  };

  if (!local) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-gray-600">
          <h5 className="font-medium text-slate-700 dark:text-gray-200">Background Config</h5>
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-gray-400 text-sm">
          Select a background track
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-gray-600">
        <div>
          <h5 className="font-medium text-slate-700 dark:text-gray-200">{local.name}</h5>
          <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            {local.filename}
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          local.enabled 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          {local.enabled ? 'Enabled' : 'Disabled'}
        </div>
      </div>

      {/* Parameters */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Name */}
        <div>
          <label className={CSS_CLASSES.label}>Name</label>
          <input
            type="text"
            value={local.name}
            onChange={(e) => handle('name', e.target.value)}
            className={CSS_CLASSES.input}
          />
        </div>

        {/* Gain */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={CSS_CLASSES.label}>Gain</label>
            <span className={CSS_CLASSES.sliderValue}>{displayGain.toFixed(1)} dB</span>
          </div>
          <DebouncedSlider
            min={-60}
            max={12}
            step={0.1}
            value={local.gainDb}
            onImmediateChange={(v) => setDisplayGain(v)}
            onChange={(v) => { setDisplayGain(v); handle('gainDb', v); }}
            className={CSS_CLASSES.range}
          />
        </div>

        {/* Mode */}
        <div>
          <label className={CSS_CLASSES.label}>Mode</label>
          <select
            value={local.mode}
            onChange={(e) => handle('mode', e.target.value as 'loop' | 'random')}
            className={CSS_CLASSES.select}
          >
            <option value="loop">Loop</option>
            <option value="random">Random</option>
          </select>
        </div>

        {/* Loop pause (seconds) when in Loop mode */}
        {local.mode === 'loop' && (
          <div>
            <label className={CSS_CLASSES.label}>Loop Pause (s)</label>
            <input
              type="number"
              className={CSS_CLASSES.input}
              step={0.1}
              value={local.loopPauseSec ?? 0}
              onChange={(e) => handle('loopPauseSec', parseFloat(e.target.value || '0'))}
            />
          </div>
        )}

        {local.mode === 'random' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={CSS_CLASSES.label}>Min Pause (s)</label>
            <input
              type="number"
              className={CSS_CLASSES.input}
              step={0.1}
              value={local.random?.minPauseSec ?? 2}
              onChange={(e) => {
                const newMin = parseFloat(e.target.value || '0');
                handle('random', {
                  minPauseSec: newMin,
                  maxPauseSec: local.random?.maxPauseSec ?? 5,
                });
              }}
            />
            </div>
            <div>
              <label className={CSS_CLASSES.label}>Max Pause (s)</label>
            <input
              type="number"
              className={CSS_CLASSES.input}
              step={0.1}
              value={local.random?.maxPauseSec ?? 5}
              onChange={(e) => {
                const newMax = parseFloat(e.target.value || '0');
                handle('random', {
                  minPauseSec: local.random?.minPauseSec ?? 2,
                  maxPauseSec: newMax,
                });
              }}
            />
            </div>
          </div>
        )}

        {/* Preview & Info (bottom) */}
        {local.filename && (
          <div>
            <label className={CSS_CLASSES.label}>Preview</label>
            <AudioPlayer src={`/sound_dir/${local.id}/${local.filename}`} />
          </div>
        )}
      </div>
    </div>
  );
}

export default BackgroundConfig;
