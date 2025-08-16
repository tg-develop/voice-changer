import { JSX } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import GenericModal from '../../Modals/GenericModal';
import { CSS_CLASSES } from '../../../styles/constants';
import { ClientState } from '@dannadori/voice-changer-client-js';

export interface PassthroughConfirmModalProps {
  appState: ClientState,
  showPassthrough: boolean,
  setShowPassthrough: (show: boolean) => void
}

const PassthroughConfirmModal: React.FC<PassthroughConfirmModalProps> = ({
  appState,
  showPassthrough,
  setShowPassthrough,
}): JSX.Element => {
  // ---------------- Handlers ----------------

  // Handle confirm
  const handleConfirm = () => {
    appState.serverSetting.updateServerSettings({
      ...appState.serverSetting.serverSetting,
      passThrough: true,
    });
    setShowPassthrough(false);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowPassthrough(false);
  };

  // ---------------- Render ----------------

  return (
    <GenericModal
      isOpen={showPassthrough}
      onClose={handleCancel}
      title="Activate Passthrough"
      size="small"
      primaryButton={{
        text: "Yes, Activate Passthrough",
        onClick: handleConfirm,
        className: CSS_CLASSES.modalPrimaryButton + " !bg-red-600 hover:!bg-red-700 focus:!ring-red-500"
      }}
      secondaryButton={{
        text: "Cancel",
        onClick: handleCancel,
        className: CSS_CLASSES.modalSecondaryButton
      }}
    >
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 border-2 border-yellow-400 dark:border-yellow-500 rounded-full">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="h-8 w-8 text-yellow-600 dark:text-yellow-400"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Are you sure you want to activate Passthrough?
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Activating Passthrough will allow you to pass audio through the server without any processing.
          </p>
        </div>
      </div>
    </GenericModal>
  );
};

export default PassthroughConfirmModal; 