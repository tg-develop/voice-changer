import { JSX } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { CSS_CLASSES } from '../../../../styles/constants';

interface MergeFilterProps {
  sampleRate: number;
  setSampleRate: (sampleRate: number) => void;
  embedder: string;
  setEmbedder: (embedder: string) => void;
  searchText: string;
  setSearchText: (searchText: string) => void;
  onFilterChange: () => void;
}

function MergeFilter({
  sampleRate,
  setSampleRate,
  embedder,
  setEmbedder,
  searchText,
  setSearchText,
  onFilterChange
}: MergeFilterProps): JSX.Element {
  // ---------------- States ----------------

  const sampleRates = [32000, 40000, 48000];

  // ---------------- Handlers ----------------

  // Handle sample rate change
  const handleSampleRateChange = (newSampleRate: number) => {
    setSampleRate(newSampleRate);
    onFilterChange();
  };

  // Handle embedder change
  const handleEmbedderChange = (newEmbedder: string) => {
    setEmbedder(newEmbedder);
    onFilterChange();
  };

  // ---------------- Render ----------------

  return (
    <div className="space-y-4 p-4 bg-slate-50 dark:bg-gray-800/30 rounded-lg border border-slate-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-md font-medium text-slate-700 dark:text-gray-200">Filter Settings</h4>
        <FontAwesomeIcon
          icon={faFilter}
          className="h-4 w-4 text-slate-500 dark:text-gray-400"
        />
      </div>

      <div className="space-y-4">
        <div>
          <label className={CSS_CLASSES.label}>Search Models:</label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by model name..."
            className={CSS_CLASSES.input}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={CSS_CLASSES.label}>Sample Rate:</label>
            <select
              value={sampleRate}
              onChange={(e) => handleSampleRateChange(Number(e.target.value))}
              className={CSS_CLASSES.select}
            >
              {sampleRates.map((rate) => (
                <option key={rate} value={rate}>
                  {rate} Hz
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={CSS_CLASSES.label}>Embedder:</label>
            <select
              value={embedder}
              onChange={(e) => handleEmbedderChange(e.target.value)}
              className={CSS_CLASSES.select}
            >
              <option value="hubert_base">Hubert_Base / Contentvec</option>
              <option value="spin_base">SPIN</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MergeFilter;