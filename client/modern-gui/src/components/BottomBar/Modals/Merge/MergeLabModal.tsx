import { useState, JSX } from 'react';
import { ModelFileKind, ModelUploadSetting, RVCModelSlot, VoiceChangerType } from '@dannadori/voice-changer-client-js';
import { CSS_CLASSES } from '../../../../styles/constants';
import GenericModal from '../../../Modals/GenericModal';
import { UIContextType } from '../../../../context/UIContext';
import MergeFilter from './MergeFilter';
import MergeModelList from './MergeModelList';
import MergeConfiguration from './MergeConfiguration';
import { useAppState } from '../../../../context/AppContext';

interface ModelMergeInfo {
  slot: RVCModelSlot;
  percentage: number;
}

interface MergeLabModalProps {
  guiState: UIContextType;
  showMerge: boolean;
  setShowMerge: (showMerge: boolean) => void;
}

function MergeLabModal({ guiState, showMerge, setShowMerge }: MergeLabModalProps): JSX.Element {
  // ---------------- States ----------------

  const appState = useAppState();

  const [sampleRate, setSampleRate] = useState<number>(40000);
  const [embedder, setEmbedder] = useState<string>('hubert_base');
  const [searchText, setSearchText] = useState<string>('');
  const [selectedModels, setSelectedModels] = useState<ModelMergeInfo[]>([]);

  // Merge configuration state
  const [downloadModel, setDownloadModel] = useState<boolean>(true);
  const [saveToMergeSlot, setSaveToMergeSlot] = useState<boolean>(false);
  const [saveToEmptySlot, setSaveToEmptySlot] = useState<boolean>(false);

  // ---------------- Functions ----------------

  // Get filtered models
  const getFilteredModels = (): RVCModelSlot[] => {
    if (!appState.serverSetting.serverSetting.modelSlots) return [];

    return appState.serverSetting.serverSetting.modelSlots.filter((slot: RVCModelSlot) => {
      if (!slot.name || slot.name.length === 0) return false;

      if (slot.samplingRate && slot.samplingRate !== sampleRate) return false;

      if (slot.embedder && slot.embedder !== embedder) return false;

      if (searchText && !slot.name.toLowerCase().includes(searchText.toLowerCase())) return false;

      return true;
    });
  };

  // Get empty slots
  const getEmptySlots = (): RVCModelSlot[] => {
    if (!appState.serverSetting.serverSetting.modelSlots) return [];

    return appState.serverSetting.serverSetting.modelSlots.filter((slot: RVCModelSlot) => {
      return !slot.name || slot.name.length === 0;
    });
  };

  // Get first empty slot
  const getFirstEmptySlot = (): RVCModelSlot | null => {
    const emptySlots = getEmptySlots();
    return emptySlots.length > 0 ? emptySlots[0] : null;
  };

  // ---------------- Handlers ----------------

  // Handle filter change
  const handleFilterChange = () => {
    setSelectedModels([]);
  };

  // Handle model toggle
  const handleModelToggle = (slot: RVCModelSlot) => {
    const isSelected = selectedModels.some(m => m.slot.slotIndex === slot.slotIndex);

    if (isSelected) {
      setSelectedModels(selectedModels.filter(m => m.slot.slotIndex !== slot.slotIndex));
    } else {
      setSelectedModels([...selectedModels, { slot, percentage: 50 }]);
    }
  };

  // Handle percentage change
  const handlePercentageChange = (slotIndex: number, percentage: number) => {
    setSelectedModels(selectedModels.map(m =>
      m.slot.slotIndex === slotIndex
        ? { ...m, percentage }
        : m
    ));
  };

  // Handle close
  const handleClose = () => {
    setShowMerge(false);
    setSelectedModels([]);
    setSampleRate(40000);
    setEmbedder('hubert_base');
    setSearchText('');
    setDownloadModel(true);
    setSaveToMergeSlot(false);
    setSaveToEmptySlot(false);
  };

  // Handle merge
  const handleMerge = async () => {
    try {
      if (downloadModel || saveToEmptySlot || saveToMergeSlot) {
        // Handle file operations efficiently - fetch once if needed
        let mergedModelBlob: Blob | null = null;

        // Get a list of selected models for merging
        const validMergeElements = selectedModels.filter((x) => {
          return x.percentage > 0;
        });

        // Start the merge process
        await appState.serverSetting.mergeModel({
          voiceChangerType: VoiceChangerType.RVC,
          command: "mix",
          files: validMergeElements.map(x => ({
            slotIndex: x.slot.slotIndex,
            strength: x.percentage / 100
          })),
        });

        guiState.showError('Models merged successfully!', 'Confirm');

        // Fetch the merged model file once
        const response = await fetch("/tmp/merged.pth");
        mergedModelBlob = await response.blob();

        // Download to local drive if requested
        if (downloadModel) {
          const url = URL.createObjectURL(mergedModelBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "merged.pth";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url); // Clean up
          guiState.showError('Models downloaded successfully!', 'Confirm');
        }

        // Upload to slot if requested
        if (saveToEmptySlot || saveToMergeSlot) {
          let slotIndex = saveToEmptySlot ? getFirstEmptySlot() : 499;

          if (saveToEmptySlot && !slotIndex) {
            guiState.showError('No empty slots available for saving.', 'Error');
            return;
          }

          // Create a File object from the already fetched blob
          const mergedModelFile = new File([mergedModelBlob], "merged.pth", { type: "application/octet-stream" });

          // Save the merged model to the specified slot
          const uploadSettingsData: ModelUploadSetting & { embedder: string } = {
            voiceChangerType: VoiceChangerType.RVC,
            slot: saveToEmptySlot ? getFirstEmptySlot()?.slotIndex! : 499,
            files: [{ kind: "rvcModel" as ModelFileKind, file: mergedModelFile, dir: "" }],
            isSampleMode: false,
            sampleId: null,
            params: {},
            embedder: embedder
          };

          await appState.serverSetting.uploadModel(uploadSettingsData);
          guiState.showError('Models uploaded successfully!', 'Confirm');
          handleClose();
        }
      } else {
        guiState.showError('No action selected. Please select at least one action.', 'Error');
      }
    } catch (error) {
      console.error('Error merging models:', error);
      guiState.showError(`Error merging models: ${error instanceof Error ? error.message : String(error)}`, 'Error');
    }
  };

  // ---------------- Render ----------------

  const filteredModels = getFilteredModels();
  const emptySlots = getEmptySlots();

  return (
    <GenericModal
      isOpen={showMerge}
      onClose={handleClose}
      title="Merge Lab"
      closeOnOutsideClick={false}
      primaryButton={{
        text: `${appState.serverSetting.isUploading ? `Merging... (${appState.serverSetting.uploadProgress.toFixed(1)}%)` : 'Merge'}`,
        onClick: handleMerge,
        disabled: ((selectedModels.length === 0) || appState.serverSetting.isUploading),
        className: CSS_CLASSES.modalPrimaryButton,
      }}
      secondaryButton={{
        text: 'Close',
        onClick: handleClose,
        className: CSS_CLASSES.modalSecondaryButton,
        disabled: appState.serverSetting.isUploading
      }}
    >
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        <MergeFilter
          sampleRate={sampleRate}
          setSampleRate={setSampleRate}
          embedder={embedder}
          setEmbedder={setEmbedder}
          searchText={searchText}
          setSearchText={setSearchText}
          onFilterChange={handleFilterChange}
        />

        <MergeConfiguration
          downloadModel={downloadModel}
          setDownloadModel={setDownloadModel}
          saveToMergeSlot={saveToMergeSlot}
          setSaveToMergeSlot={setSaveToMergeSlot}
          saveToEmptySlot={saveToEmptySlot}
          setSaveToEmptySlot={setSaveToEmptySlot}
          emptySlots={emptySlots}
        />

        <MergeModelList
          models={filteredModels}
          selectedModels={selectedModels}
          onModelToggle={handleModelToggle}
          onPercentageChange={handlePercentageChange}
          modelDir={appState.serverSetting.serverSetting.voiceChangerParams.model_dir}
        />
      </div>
    </GenericModal>
  );
}

export default MergeLabModal; 