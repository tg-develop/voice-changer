import { JSX, useState, useEffect } from 'react';
import { useAppState } from '../../../../context/AppContext';
import { useUIContext } from '../../../../context/UIContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTrash, faSpinner, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ModelInfoDict } from '@dannadori/voice-changer-client-js';

interface DownloaderViewProps {
  onDownloadStateChange?: (isDownloading: boolean) => void;
}

function DownloaderView({ onDownloadStateChange }: DownloaderViewProps): JSX.Element {
  const appState = useAppState();
  const uiState = useUIContext();
  
  const [loadingItems, setLoadingItems] = useState<Record<string, 'download' | 'delete' | null>>({});
  const [isAnyDownloading, setIsAnyDownloading] = useState(false);
  
  // Notify parent component about download state changes
  const updateDownloadState = (downloading: boolean) => {
    setIsAnyDownloading(downloading);
    if (onDownloadStateChange) {
      onDownloadStateChange(downloading);
    }
  };

  // Safely get embedders and pitch extractors from server settings with type assertion
  const serverSetting = appState.serverSetting.serverSetting as any;
  
  // Filter models based on DirectML backend
  const filterModels = (models: ModelInfoDict): ModelInfoDict => {
    const serverInfo = (appState.serverSetting as any).serverInfo;
    if (serverInfo?.edition?.includes("DirectML")) {
      const filtered: ModelInfoDict = {};
      Object.entries(models).forEach(([key, value]) => {
        if (key.includes('_onnx')) {
          filtered[key] = value;
        }
      });
      return filtered;
    }
    return models;
  };

  // Get and filter models
  const embedders: ModelInfoDict = filterModels(serverSetting.embedders || {});
  const pitchExtractors: ModelInfoDict = filterModels(serverSetting.pitchExtractors || {});

  const handleModelAction = async (
    type: 'embedder' | 'pitchExtractor', 
    action: 'download' | 'delete',
    id: string,
    info: ModelInfoDict[string]
  ) => {
    // Only prevent new downloads if another download is in progress
    if (action === 'download' && isAnyDownloading && loadingItems[id] !== 'download') return;
    // Prevent deletion of mandatory or in-use items (should be handled by UI, but keeping as a safeguard)
    if (action === 'delete' && (info.mandatory || 
        (type === 'embedder' && isEmbedderInUse(id)) ||
        (type === 'pitchExtractor' && isPitchExtractorInUse(id)))) {
      return;
    }
    
    try {
      if (action === 'download') {
        updateDownloadState(true);
      }
      setLoadingItems(prev => ({ ...prev, [id]: action }));
      
      // The id is already the model key from the dictionary
      if (action === 'download') {
        await appState.serverSetting.downloadPretrained(id);
      } else {
        await appState.serverSetting.deletePretrained(id);
      }
      
      // Refresh server info to update the installed status
      await appState.serverSetting.reloadServerInfo();
      
      // Show success message with model name
      const actionText = action === 'download' ? 'downloaded' : 'deleted';
      const modelType = type === 'embedder' ? 'Embedder' : 'Pitch Extractor';
      uiState.showError(
        `${modelType} "${info.name || id}" ${actionText} successfully!`,
        'Confirm'
      );
    } catch (error) {
      console.error(`Error ${action}ing ${type}:`, error);
      uiState.showError(
        `Failed to ${action} ${type}: ${error instanceof Error ? error.message : String(error)}`,
        'Error'
      );
    } finally {
      setLoadingItems(prev => {
        const newState = { ...prev, [id]: null };
        // Check if there are any downloads still in progress
        const anyDownloadsLeft = Object.values(newState).some(v => v === 'download');
        if (!anyDownloadsLeft) {
          updateDownloadState(false);
        }
        return newState;
      });
    }
  };

  // Check if an embedder is in use by any model
  const isEmbedderInUse = (embedderId: string): boolean => {
    try {
      const modelSlots = (appState.serverSetting.serverSetting as any).modelSlots || [];
      return modelSlots.some((slot: any) => 
        slot.embedder === embedderId || 
        (slot.embFile && slot.embFile.includes(embedderId))
      );
    } catch (e) {
      console.error('Error checking embedder usage:', e);
      return false;
    }
  };

  // Check if a pitch extractor is currently in use
  const isPitchExtractorInUse = (pitchExtractorId: string): boolean => {
    try {
      const f0Detector = (appState.serverSetting.serverSetting as any).f0Detector;
      return f0Detector === pitchExtractorId;
    } catch (e) {
      console.error('Error checking pitch extractor usage:', e);
      return false;
    }
  };

  const renderItem = (id: string, info: ModelInfoDict[string], type: 'embedder' | 'pitchExtractor') => {
    if (!info) return null;
    
    const isLoading = loadingItems[id];
    const isDownloading = isLoading === 'download';
    const isDeleting = isLoading === 'delete';
    const name = info.name || id;
    const isInUse = 
      (type === 'embedder' && !info.mandatory && isEmbedderInUse(id)) ||
      (type === 'pitchExtractor' && !info.mandatory && isPitchExtractorInUse(id));

    return (
      <div key={id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors border-b border-slate-100 dark:border-gray-700 last:border-0">
        <div className="flex-1">
          <span className="font-medium text-slate-800 dark:text-gray-200">{name}</span>
          {isInUse ? (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
              In Use
            </span>
          ) : info.mandatory ? (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
              Required
            </span>
          ) : null}
        </div>
        <div className="flex items-center space-x-2">
          {info.downloaded ? (
            <>
              <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-green-800 bg-green-100 dark:bg-green-900/50 dark:text-green-300 rounded-full border border-green-200 dark:border-green-800">
                <FontAwesomeIcon icon={faCheck} className="mr-1" />
                Installed
              </span>
              {!uiState.isConverting && !info.mandatory && !isInUse && (
                <button
                  onClick={() => handleModelAction(type, 'delete', id, info)}
                  disabled={isDeleting}
                  className="px-3 py-1 text-sm rounded-md transition-colors flex items-center bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/50"
                >
                  {isDeleting ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" />
                  ) : (
                    <FontAwesomeIcon icon={faTrash} className="mr-1" />
                  )}
                  Delete
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => handleModelAction(type, 'download', id, info)}
              disabled={isAnyDownloading && !isDownloading}
              className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${
                isAnyDownloading && !isDownloading
                  ? 'bg-slate-100 text-slate-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : isDownloading
                  ? 'bg-blue-600 text-white dark:bg-blue-700 cursor-wait'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50'
              }`}
            >
              {isDownloading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" />
                  Downloading
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faDownload} className="mr-1" />
                  Download
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Sort items with mandatory ones first, then by name
  const sortItems = (items: ModelInfoDict) => {
    return Object.entries(items)
      .sort(([idA, a], [idB, b]) => {
        // Mandatory items first
        if (a.mandatory && !b.mandatory) return -1;
        if (!a.mandatory && b.mandatory) return 1;
        // Then sort by name
        return (a.name || idA).localeCompare(b.name || idB);
      });
  };

  const sortedEmbedders = sortItems(embedders);
  const sortedPitchExtractors = sortItems(pitchExtractors);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-4 pb-2 border-b border-slate-200 dark:border-gray-700">Embedders</h3>
        <div className="space-y-3">
          {sortedEmbedders.length > 0 ? (
            <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden">
              {sortedEmbedders.map(([id, info]) => renderItem(id, info, 'embedder'))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 dark:text-gray-400 bg-white dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
              No embedders available
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-4 pb-2 border-b border-slate-200 dark:border-gray-700">Pitch Extraction Algorithms</h3>
        <div className="space-y-3">
          {sortedPitchExtractors.length > 0 ? (
            <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden">
              {sortedPitchExtractors.map(([id, info]) => renderItem(id, info, 'pitchExtractor'))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 dark:text-gray-400 bg-white dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
              No pitch extraction algorithms available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DownloaderView;
