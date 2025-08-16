import { JSX } from 'react';
import { useAppState } from '../../../context/AppContext';
import GenericModal from '../../Modals/GenericModal';
import { CSS_CLASSES } from '../../../styles/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { useAppRoot } from '../../../context/AppRootProvider';

interface ServerInfoModalProps {
  showServerInfo: boolean;
  setShowServerInfo: (showServerInfo: boolean) => void;
}

function ServerInfoModal({ showServerInfo, setShowServerInfo }: ServerInfoModalProps): JSX.Element {
  // ---------------- States ----------------
  const appState = useAppState();
  const { appGuiSettingState } = useAppRoot();
  const serverJson = JSON.stringify(appState.serverSetting.serverSetting, null, 2);

  // ---------------- Handlers ----------------

  // Handle close modal
  const handleClose = () => {
    setShowServerInfo(false);
  };

  // ---------------- Render ----------------

  return (
    <GenericModal
      isOpen={showServerInfo}
      onClose={handleClose}
      title="Server Info"
      secondaryButton={{
        text: 'Close',
        onClick: handleClose,
        className: CSS_CLASSES.modalSecondaryButton,
      }}
    >
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h4 className="text-base font-semibold text-green-900 dark:text-green-100 mr-2">Server</h4>
                <span className="px-2 py-1 text-xs font-medium bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
                  deiteris
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/50 dark:bg-black/20 rounded-md p-2">
                  <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Edition</div>
                  <div className="text-green-900 dark:text-green-100 font-mono">
                    {appGuiSettingState.serverInfo.edition || 'N/A'}
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 rounded-md p-2">
                  <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Version</div>
                  <div className="text-green-900 dark:text-green-100 font-mono">
                    {appGuiSettingState.serverInfo.version || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <a
              href="https://github.com/deiteris"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 rounded-md transition-all duration-200"
            >
              <FontAwesomeIcon icon={faGithub} className="mr-1.5" size="sm" />
              <span className="font-medium">GitHub</span>
              <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1" size="xs" />
            </a>
          </div>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg shadow-inner">
          <pre className="text-xs text-slate-700 dark:text-gray-300 overflow-auto max-h-[40vh] custom-scrollbar p-2 rounded-md bg-white dark:bg-slate-900">
            <code>{serverJson}</code>
          </pre>
        </div>
      </div>
    </GenericModal>
  );
}

export default ServerInfoModal;