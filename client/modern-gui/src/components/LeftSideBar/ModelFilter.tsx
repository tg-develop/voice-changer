import { ClientState, ModelSlotUnion, RVCModelSlot, VoiceChangerType } from "@dannadori/voice-changer-client-js";
import { faFilter, faSearch, faSort, faTimes, faArrowUpAZ, faArrowDownAZ } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo, useState, useEffect } from "react";
import { CSS_CLASSES } from "../../styles/constants";

interface ModelFilterProps {
  appState: ClientState;
  setFilteredAndSortedModels: (models: RVCModelSlot[]) => void;
}

type SortOption = 'slot' | 'name';
type SampleRateFilter = number | 'All';

const sortOptions: { value: SortOption, label: string }[] = [
  { value: 'slot', label: 'Slot' },
  { value: 'name', label: 'Name' },
];

function ModelFilter({
  appState,
  setFilteredAndSortedModels
}: ModelFilterProps) {
  // ---------------- State ----------------
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSort, setCurrentSort] = useState<SortOption>('slot');
  const [typeVersionFilter, setTypeVersionFilter] = useState<string>('All');
  const [rateFilter, setRateFilter] = useState<SampleRateFilter>('All');
  const [embedderFilter, setEmbedderFilter] = useState<string>('All');
  const [isSortFilterVisible, setIsSortFilterVisible] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ---------------- Hooks ----------------

  // Extract and validate RVC models from server state
  const localModels: RVCModelSlot[] = useMemo(() => {
    if (appState.serverSetting?.serverSetting?.modelSlots) {
      return appState.serverSetting.serverSetting.modelSlots
        .filter((slot: ModelSlotUnion): slot is RVCModelSlot =>
          slot.voiceChangerType === VoiceChangerType.RVC &&
          slot.name !== "" &&
          typeof slot.slotIndex === 'number'
        )
        .map((slot: RVCModelSlot): RVCModelSlot => ({
          ...slot,
          slotIndex: slot.slotIndex as number,
        }));
    }
    return [];
  }, [appState.serverSetting?.serverSetting?.modelSlots]);

  // Generate dynamic filter options based on available models
  const modelTypeVersionOptions = useMemo(() => {
    const types = new Set<string>();
    localModels.forEach(model => {
      if (model.voiceChangerType) {
        types.add(`${model.voiceChangerType}`);
      }
    });
    return ['All', ...Array.from(types).sort()];
  }, [localModels]);

  // Extract unique sample rates from models and sort numerically
  const sampleRateOptions = useMemo(() => {
    const rates = new Set<number>();
    localModels.forEach(model => {
      if (model.samplingRate) {
        rates.add(model.samplingRate);
      }
    });
    return ['All' as SampleRateFilter, ...Array.from(rates).sort((a, b) => a - b)];
  }, [localModels]);

  // Generate list of available embedder types from models
  const embedderOptions = useMemo(() => {
    const embedders = new Set<string>();
    localModels.forEach(model => {
      if (model.embedder) {
        embedders.add(model.embedder);
      }
    });
    return ['All', ...Array.from(embedders).sort()];
  }, [localModels]);

  // Main processing logic: applies all filters and sorting
  const filteredAndSortedModels = useMemo(() => {
    let processedModels = [...localModels];

    if (searchTerm) {
      processedModels = processedModels.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeVersionFilter !== 'All') {
      processedModels = processedModels.filter(model =>
        model.voiceChangerType && model.version && `${model.voiceChangerType} ${model.version}` === typeVersionFilter
      );
    }

    if (rateFilter !== 'All') {
      processedModels = processedModels.filter(model => model.samplingRate === rateFilter);
    }

    if (embedderFilter !== 'All') {
      processedModels = processedModels.filter(model => model.embedder === embedderFilter);
    }

    processedModels.sort((a, b) => {
      let comparison = 0;
      if (currentSort === 'slot') {
        comparison = a.slotIndex - b.slotIndex;
      } else if (currentSort === 'name') {
        comparison = a.name.localeCompare(b.name);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return processedModels;
  }, [localModels, searchTerm, currentSort, typeVersionFilter, rateFilter, embedderFilter, sortDirection]);

  // Update parent component with processed model list
  useEffect(() => {
    setFilteredAndSortedModels(filteredAndSortedModels);
  }, [filteredAndSortedModels, setFilteredAndSortedModels]);

  // ---------------- Render ----------------

  return (
    <>
      <div className="relative mb-2">
        <input
          type="search"
          placeholder="Search Models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 pr-10 border border-slate-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-sm placeholder-slate-400 dark:placeholder-gray-500 text-slate-700 dark:text-slate-100 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden"
        />
        <FontAwesomeIcon icon={faSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500" />
      </div>

      {/* Filter and Sort Toggle Button */}
      <div className="mb-2">
        <button
          onClick={() => setIsSortFilterVisible(!isSortFilterVisible)}
          className="w-full flex items-center justify-between p-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-md border border-slate-300 dark:border-gray-600"
        >
          <span><FontAwesomeIcon icon={faFilter} className="mr-2" /> Filter & Sort</span>
          <FontAwesomeIcon icon={isSortFilterVisible ? faTimes : faSort} />
        </button>
      </div>

      {/* Filter and Sort Controls - Conditional Rendering */}
      {isSortFilterVisible && (
        <div className="space-y-3 mb-3 p-3 border border-slate-200 dark:border-gray-700 rounded-md">
          {/* Sort Controls */}
          <div className="space-y-1 pb-2 border-b border-slate-200 dark:border-gray-700">
            <label htmlFor="sortOption" className="text-xs font-medium text-slate-600 dark:text-gray-300 flex items-center"><FontAwesomeIcon icon={faSort} className="mr-1.5" />Sort by:</label>
            <div className="flex gap-2 items-center">
              <select id="sortOption" value={currentSort} onChange={(e) => setCurrentSort(e.target.value as SortOption)} className={`${CSS_CLASSES.select} flex-grow`}>
                {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <button
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 border border-slate-300 dark:border-gray-600 rounded-md hover:bg-slate-50 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-300"
                title={sortDirection === 'asc' ? "Sort Descending" : "Sort Ascending"}
              >
                <FontAwesomeIcon icon={sortDirection === 'asc' ? faArrowUpAZ : faArrowDownAZ} className="text-xs" />
              </button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="space-y-1 pt-2">
            <p className="text-xs font-medium text-slate-600 dark:text-gray-300 flex items-center mb-1"><FontAwesomeIcon icon={faFilter} className="mr-1.5" />Filter by:</p>
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="typeVersionFilter" className="text-xs font-medium text-slate-500 dark:text-gray-400">Type:</label>
              <select id="typeVersionFilter" value={typeVersionFilter} onChange={(e) => setTypeVersionFilter(e.target.value)} className={CSS_CLASSES.select}>
                {modelTypeVersionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="rateFilter" className="text-xs font-medium text-slate-500 dark:text-gray-400">Rate:</label>
              <select id="rateFilter" value={rateFilter === 'All' ? 'All' : rateFilter} onChange={(e) => setRateFilter(e.target.value === 'All' ? 'All' : Number(e.target.value) as SampleRateFilter)} className={CSS_CLASSES.select}>
                {sampleRateOptions.map(opt => <option key={opt} value={opt}>{opt === 'All' ? 'All' : `${opt / 1000}kHz`}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <label htmlFor="embedderFilter" className="text-xs font-medium text-slate-500 dark:text-gray-400">Embedder:</label>
              <select id="embedderFilter" value={embedderFilter} onChange={(e) => setEmbedderFilter(e.target.value)} className={CSS_CLASSES.select}>
                {embedderOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ModelFilter;