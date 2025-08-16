import { JSX } from 'react';
import GenericModal from '../../Modals/GenericModal';
import { CSS_CLASSES } from '../../../styles/constants';
import { ModelUploadSetting, RVCModelSlot } from '@dannadori/voice-changer-client-js';
import { useAppState } from '../../../context/AppContext';
import { useUIContext } from '../../../context/UIContext';

interface EditModelModalProps {
  model: RVCModelSlot;
  showModal: boolean;
  setShowEdit: (show: boolean) => void;
}

function EditModelModal({ model, showModal, setShowEdit }: EditModelModalProps): JSX.Element {
  // ---------------- State ----------------
  const appState = useAppState();
  const guiState = useUIContext();

  // ---------------- Handlers ----------------

  // Handle cancel button click
  const handleCancel = () => {
    setShowEdit(false);
  };

  // Handle save button click
  const handleSave = () => {
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
    guiState.showError('Edit model successfully.', "Confirm");
    setShowEdit(false);
  };

  // ---------------- Render ----------------

  return (
    <GenericModal
      isOpen={showModal}
      onClose={handleCancel}
      title="Edit Model"
      size="small"
      primaryButton={{
        text: "Save",
        onClick: handleSave,
        className: CSS_CLASSES.modalPrimaryButton,
      }}
      secondaryButton={{
        text: "Cancel",
        onClick: handleCancel,
        className: CSS_CLASSES.modalSecondaryButton,
      }}
    >
      <div>
        <p className="text-sm text-slate-600 dark:text-gray-300">
          Edit model content for {model.name || 'model'} (ID: {model.slotIndex}) goes here. Allow modification of model name, parameters, etc.
        </p>
      </div>
    </GenericModal>
  );
}

export default EditModelModal; 