import React, { JSX } from 'react';
import GenericModal from '../../Modals/GenericModal';
import { CSS_CLASSES } from '../../../styles/constants';
import { ModelUploadSetting, RVCModelSlot } from '@dannadori/voice-changer-client-js';
import { useAppState } from '../../../context/AppContext';
import { useUIContext } from '../../../context/UIContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faExclamationTriangle, faCircle } from '@fortawesome/free-solid-svg-icons';
import { useInitialPlaceholder } from '../../../scripts/usePlaceholder';

interface DeleteModelModalProps {
  model: RVCModelSlot;
  showModal: boolean;
  setShowDelete: (show: boolean) => void;
  modelDir: string;
}

function DeleteModelModal({ model, showModal, setShowDelete, modelDir }: DeleteModelModalProps): JSX.Element {
  // ---------------- State ----------------
  const appState = useAppState();
  const guiState = useUIContext();

  const icon = model.iconFile.length > 0 ? "/" + modelDir + "/" + model.slotIndex + "/" + model.iconFile.split(/[\/\\]/).pop() : "";
  const placeholder = useInitialPlaceholder(model.name);

  // ---------------- Handlers ----------------

  // Handle confirm button click
  const handleConfirm = async () => {
    const settings: ModelUploadSetting & { embedder: string } = {
      voiceChangerType: "RVC",
      slot: model.slotIndex,
      files: [],
      isSampleMode: false,
      sampleId: null,
      params: {},
      embedder: "hubert_base"
    };
    appState.serverSetting.uploadModel(settings);

    if (appState.serverSetting.serverSetting.modelSlotIndex === model.slotIndex) {
      guiState.startLoading();
      await appState.serverSetting.updateServerSettings({ ...appState.serverSetting.serverSetting, modelSlotIndex: 0 });
      guiState.stopLoading();
    }

    guiState.showError('Deleted model successfully.', "Confirm");
    setShowDelete(false);
  };

  // Handle cancel button click
  const handleCancel = () => {
    setShowDelete(false);
  };

  // ---------------- Render ----------------

  return (
    <GenericModal
      isOpen={showModal}
      onClose={handleCancel}
      title="Delete Model"
      size="small"
      primaryButton={{
        text: "Delete",
        onClick: handleConfirm,
        className: CSS_CLASSES.modalPrimaryButton + " !bg-red-600 hover:!bg-red-700 focus:!ring-red-500"
      }}
      secondaryButton={{
        text: "Cancel",
        onClick: handleCancel,
        className: CSS_CLASSES.modalSecondaryButton
      }}
    >
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center">
            <FontAwesomeIcon icon={faTrash} className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Permanently Delete Model
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to permanently delete the following model?
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <img
              src={icon.length > 0 ? icon : placeholder}
              alt={model.name}
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {model.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Slot {model.slotIndex} • {model.embedder || 'Unknown'} • {model.samplingRate || 'Unknown'} Hz • {model.voiceChangerType || 'RVC'}{model.version || '1'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </GenericModal>
  );
}

export default DeleteModelModal; 