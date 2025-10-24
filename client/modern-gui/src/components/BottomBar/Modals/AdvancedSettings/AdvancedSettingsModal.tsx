import { JSX, useState } from 'react';
import { useAppState } from '../../../../context/AppContext';
import GenericModal from '../../../Modals/GenericModal';
import { CSS_CLASSES } from '../../../../styles/constants';
import SettingsView from './SettingsView';
import DownloaderView from './DownloaderView';

interface AdvancedSettingsModalProps {
  showAdvancedSettings: boolean;
  setShowAdvancedSettings: (showAdvancedSettings: boolean) => void;
}

const TAB_IDS = {
  settings: 'settings',
  downloader: 'downloader'
}

function AdvancedSettingsModal({ showAdvancedSettings, setShowAdvancedSettings }: AdvancedSettingsModalProps): JSX.Element {
  const appState = useAppState();
  const [activeTab, setActiveTab] = useState(TAB_IDS.settings);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleClose = () => {
    if (!isDownloading) {
      setShowAdvancedSettings(false);
    }
  };
  
  const handleDownloadStateChange = (downloading: boolean) => {
    setIsDownloading(downloading);
  };

  return (
    <GenericModal
      isOpen={showAdvancedSettings}
      onClose={handleClose}
      title="Advanced Settings"
      secondaryButton={{
        text: 'Close',
        onClick: handleClose,
        className: CSS_CLASSES.modalSecondaryButton,
        disabled: appState.serverSetting.isUploading || isDownloading
      }}
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-row border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              activeTab === TAB_IDS.settings
                ? 'text-blue-600 border-b-2 border-blue-500 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab(TAB_IDS.settings)}
          >
            Settings
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              activeTab === TAB_IDS.downloader
                ? 'text-blue-600 border-b-2 border-blue-500 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            onClick={() => setActiveTab(TAB_IDS.downloader)}
          >
            Downloader
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto py-2">
          {activeTab === TAB_IDS.settings && <SettingsView />}
          {activeTab === TAB_IDS.downloader && (
            <DownloaderView onDownloadStateChange={handleDownloadStateChange} />
          )}
        </div>
      </div>
    </GenericModal>
  );
}

export default AdvancedSettingsModal;
