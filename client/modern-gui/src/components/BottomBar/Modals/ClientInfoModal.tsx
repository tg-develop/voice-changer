import { JSX } from 'react';
import { useAppState } from '../../../context/AppContext';
import GenericModal from '../../Modals/GenericModal';
import { CSS_CLASSES } from '../../../styles/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { useAppRoot } from '../../../context/AppRootProvider';

interface ClientInfoModalProps {
  showClientInfo: boolean;
  setShowClientInfo: (showClientInfo: boolean) => void;
}

function ClientInfoModal({ showClientInfo, setShowClientInfo }: ClientInfoModalProps): JSX.Element {
  // ---------------- States ----------------
  const appState = useAppState();
  const { appGuiSettingState } = useAppRoot();
  const clientJson = JSON.stringify(appState.setting, null, 2);

  // ---------------- Handlers ----------------

  // Handle close modal
  const handleClose = () => {
    setShowClientInfo(false);
  };

  // ---------------- Render ----------------

  return (
    <GenericModal
      isOpen={showClientInfo}
      onClose={handleClose}
      title="Client Info"
      secondaryButton={{
        text: 'Close',
        onClick: handleClose,
        className: CSS_CLASSES.modalSecondaryButton,
      }}
    >
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100 mr-2">Client</h4>
                <span className="px-2 py-1 text-xs font-medium bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
                  tg-develop
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/50 dark:bg-black/20 rounded-md p-2">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Edition</div>
                  <div className="text-blue-900 dark:text-blue-100 font-mono">
                    {appGuiSettingState.appGuiSetting.edition || 'N/A'}
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-black/20 rounded-md p-2">
                  <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Version</div>
                  <div className="text-blue-900 dark:text-blue-100 font-mono">
                    {appGuiSettingState.appGuiSetting.version || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <a
              href="https://github.com/tg-develop"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 rounded-md transition-all duration-200"
            >
              <FontAwesomeIcon icon={faGithub} className="mr-1.5" size="sm" />
              <span className="font-medium">GitHub</span>
              <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1" size="xs" />
            </a>
          </div>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg shadow-inner">
          <pre className="text-xs text-slate-700 dark:text-gray-300 overflow-auto max-h-[40vh] custom-scrollbar p-2 rounded-md bg-white dark:bg-slate-900">
            <code>{clientJson}</code>
          </pre>
        </div>
      </div>
    </GenericModal>
  );
}

export default ClientInfoModal;