import { JSX, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faShuffle, faRepeat } from '@fortawesome/free-solid-svg-icons';
import { CSS_CLASSES } from '../../styles/constants';
import { BackgroundTrack } from '@dannadori/voice-changer-client-js';


export type BackgroundListProps = {
  tracks: BackgroundTrack[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddFiles: (files: FileList) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
};

function TrackItem({ track, isSelected, onSelect, onDelete, onToggle }: {
  track: BackgroundTrack;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={`p-3 rounded-md border cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
          : 'border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:border-slate-300 dark:hover:border-gray-500'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">         
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`${CSS_CLASSES.iconButton} ${track.enabled ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300' : 'text-slate-400 dark:text-gray-500 hover:text-slate-500 dark:hover:text-gray-400'}`}
            title={track.enabled ? 'Disable' : 'Enable'}
          >
            <FontAwesomeIcon icon={track.mode === 'loop' ? faRepeat : faShuffle} className="h-4 w-4" />
          </button>

          <div>
          <div className="font-medium text-slate-700 dark:text-gray-200 text-sm flex items-center space-x-2">
            <span className="truncate max-w-[180px]" title={track.name || track.filename }>
              {track.name || track.filename || 'Untitled'}
            </span>
          </div>
            <div className="text-xs text-slate-500 dark:text-gray-400 flex items-center space-x-2">
              <span className="capitalize">{track.mode}</span>
              <span>•</span>
              {track.mode === 'loop' ? (
                <span>Pause {((track.loopPauseSec ?? 0)).toFixed(1)}s</span>
              ) : (
                <span>
                  Pause {(track.random?.minPauseSec ?? 2).toFixed(1)}–{(track.random?.maxPauseSec ?? 5).toFixed(1)}s
                </span>
              )}
              <span>•</span>
              <span>{track.gainDb.toFixed(1)} dB</span>
            </div>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className={`${CSS_CLASSES.iconButton} text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300`}
          title="Delete"
        >
          <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function BackgroundList({ tracks, selectedId, onSelect, onAddFiles, onDelete, onToggle }: BackgroundListProps): JSX.Element {

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-gray-600">
        <div>
          <h5 className="font-medium text-slate-700 dark:text-gray-200">Background Tracks</h5>
          <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">Tracks will be mixed with converted audio</div>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) onAddFiles(e.target.files);
              // reset value to allow re-selecting same file
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`${CSS_CLASSES.iconButton} text-green-600 dark:text-green-400`}
            title="Add audio file(s)"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0">
        {tracks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-gray-400 text-sm">
            No background tracks yet. Use the + button to add audio files.
          </div>
        ) : (
          <div className="space-y-1">
            {tracks.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                isSelected={selectedId === track.id}
                onSelect={() => onSelect(track.id)}
                onDelete={() => onDelete(track.id)}
                onToggle={() => onToggle(track.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
