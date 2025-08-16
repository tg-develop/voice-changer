import { JSX } from 'react';
import { RVCModelSlot } from '@dannadori/voice-changer-client-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { CSS_CLASSES } from '../../../../styles/constants';

interface MergeConfigurationProps {
  downloadModel: boolean;
  setDownloadModel: (download: boolean) => void;
  saveToMergeSlot: boolean;
  setSaveToMergeSlot: (save: boolean) => void;
  saveToEmptySlot: boolean;
  setSaveToEmptySlot: (save: boolean) => void;
  emptySlots: RVCModelSlot[];
}

function MergeConfiguration({
  downloadModel,
  setDownloadModel,
  saveToMergeSlot,
  setSaveToMergeSlot,
  saveToEmptySlot,
  setSaveToEmptySlot,
  emptySlots
}: MergeConfigurationProps): JSX.Element {
  // ---------------- Handlers ----------------

  // Handle merge slot change
  const handleMergeSlotChange = (checked: boolean) => {
    setSaveToMergeSlot(checked);
    if (checked) {
      setSaveToEmptySlot(false);
    }
  };

  // Handle empty slot change
  const handleEmptySlotChange = (checked: boolean) => {
    setSaveToEmptySlot(checked);
    if (checked) {
      setSaveToMergeSlot(false);
    }
  };

  // Handle download model change
  const handleDownloadModelChange = (checked: boolean) => {
    setDownloadModel(checked);
  };

  // ---------------- Render ----------------

  return (
    <div className="space-y-4 p-4 bg-slate-50 dark:bg-gray-800/30 rounded-lg border border-slate-200 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <h4 className="text-md font-medium text-slate-700 dark:text-gray-200">Merge Options</h4>
        <FontAwesomeIcon
          icon={faCog}
          className="h-4 w-4 text-slate-500 dark:text-gray-400"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="download-model"
            checked={downloadModel}
            onChange={(e) => handleDownloadModelChange(e.target.checked)}
            className={CSS_CLASSES.checkbox}
          />
          <label htmlFor="download-model" className={CSS_CLASSES.label}>
            Download merged model
          </label>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="save-merge-slot"
            checked={saveToMergeSlot}
            onChange={(e) => handleMergeSlotChange(e.target.checked)}
            className={CSS_CLASSES.checkbox}
          />
          <label htmlFor="save-merge-slot" className={CSS_CLASSES.label}>
            Save to merge slot
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="save-empty-slot"
              checked={saveToEmptySlot}
              onChange={(e) => handleEmptySlotChange(e.target.checked)}
              disabled={emptySlots.length === 0}
              className={CSS_CLASSES.checkbox}
            />
            <label htmlFor="save-empty-slot" className={`${CSS_CLASSES.label} ${emptySlots.length === 0 ? 'text-slate-400 dark:text-gray-500' : ''}`}>
              Save to empty slot (auto-select first available)
            </label>
          </div>

          {emptySlots.length === 0 && (
            <div className="ml-6 text-xs text-slate-500 dark:text-gray-400">
              No empty slots available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MergeConfiguration;