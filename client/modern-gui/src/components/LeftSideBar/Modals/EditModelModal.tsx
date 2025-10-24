import { JSX, useEffect, useState, ChangeEvent } from 'react';
import GenericModal from '../../Modals/GenericModal';
import { CSS_CLASSES } from '../../../styles/constants';
import { RVCModelSlot, ModelInfo } from '@dannadori/voice-changer-client-js';
import { useAppState } from '../../../context/AppContext';
import { useUIContext } from '../../../context/UIContext';

type EditFormState = {
  modelName: string;
  thumbnailFile: File | null;
  embedder: string;
};

interface EditModelModalProps {
  model: RVCModelSlot;
  showModal: boolean;
  setShowEdit: (show: boolean) => void;
  modelDir?: string;
  icon?: string;
}

function EditModelModal({ model, showModal, setShowEdit, modelDir, icon }: EditModelModalProps): JSX.Element {
  // ---------------- State ----------------
  const appState = useAppState();
  const guiState = useUIContext();

  const [form, setForm] = useState<EditFormState>({
    modelName: model.name || '',
    thumbnailFile: null,
    embedder: (model as any).embedder || (Object.values(appState.serverSetting.serverSetting.embedders || {})[0]?.name || '')
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isThumbnailExpanded, setIsThumbnailExpanded] = useState(false);
  const [previewMode, setPreviewMode] = useState<'settings' | 'list'>('settings');

  // Auto-expand thumbnail on select
  useEffect(() => {
    if (thumbnailPreview) setIsThumbnailExpanded(true);
  }, [thumbnailPreview]);

  // Prefill thumbnail preview from existing icon if available
  useEffect(() => {
    if (!showModal) return;
    if (form.thumbnailFile) return; // user selected new file
    // Derive URL from props.icon or modelDir + model.iconFile
    let currentIcon = icon || '';
    if (!currentIcon && modelDir && model.iconFile && model.iconFile.length > 0) {
      const last = model.iconFile.split(/[\\/\\]/).pop() as string;
      currentIcon = `/${modelDir}/${model.slotIndex}/${last}`;
    }
    setThumbnailPreview(currentIcon || null);
  }, [showModal, modelDir, icon, model.iconFile, model.slotIndex]);

  // ---------------- Handlers ----------------
  const handleCancel = () => {
    if (!appState.serverSetting.isUploading) {
      setShowEdit(false);
      setForm({ modelName: model.name || '', thumbnailFile: null, embedder: (model as any).embedder || 'hubert_base' });
      setThumbnailPreview(null);
    }
  };

  const handleThumbnailFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setForm({ ...form, thumbnailFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setForm({ ...form, thumbnailFile: null });
      setThumbnailPreview(null);
    }
  };

  const handleSave = async () => {
    const trimmedName = form.modelName.trim();
    if (!trimmedName) {
      guiState.showError('Bitte einen Modelnamen eingeben.', 'Error');
      return;
    }
    // Upload thumbnail if provided (rename to thumbnail.ext)
    try {
      if (form.thumbnailFile) {
        const thumb = form.thumbnailFile;
        const dotPos = thumb.name.lastIndexOf('.');
        const extOnly = dotPos >= 0 ? thumb.name.substring(dotPos + 1) : '';
        const thumbName = extOnly ? `thumbnail.${extOnly}` : 'thumbnail';
        const renamedThumb = new File([thumb], thumbName, { type: thumb.type, lastModified: thumb.lastModified });
        await appState.serverSetting.uploadAssets(model.slotIndex, 'iconFile', renamedThumb);
      }
    } catch (e) {
      console.warn('Thumbnail upload failed (continuing):', e);
    }

    // Update name and embedder via serverSetting.updateModelInfo
    try {
      await appState.serverSetting.updateModelInfo(model.slotIndex, 'name', trimmedName);
    } catch (e) {
      console.warn('Name update failed (continuing):', e);
    }
    try {
      await appState.serverSetting.updateModelInfo(model.slotIndex, 'embedder', form.embedder);
    } catch (e) {
      console.warn('Embedder update failed (continuing):', e);
    }

    await appState.serverSetting.reloadServerInfo();
    guiState.showError('Model updated successfully.', 'Confirm');
    setShowEdit(false);
  };

  // ---------------- Render ----------------
  return (
    <GenericModal
      isOpen={showModal}
      onClose={handleCancel}
      title={`Edit Model - Slot ${model.slotIndex}`}
      closeOnOutsideClick={false}
      primaryButton={{
        text: `${appState.serverSetting.isUploading ? `Saving... (${appState.serverSetting.uploadProgress.toFixed(1)}%)` : 'Save'}`,
        onClick: handleSave,
        className: CSS_CLASSES.modalPrimaryButton,
        disabled: appState.serverSetting.isUploading
      }}
      secondaryButton={{
        text: 'Cancel',
        onClick: handleCancel,
        className: CSS_CLASSES.modalSecondaryButton,
        disabled: appState.serverSetting.isUploading
      }}
    >
      <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
        {/* Model name and embedder */}
        <div className="space-y-4 ml-2 pl-3 border-l-2 border-slate-200 dark:border-gray-700">
          <div className="space-y-2">
            <label htmlFor="editModelName" className={CSS_CLASSES.label}>Model Name:</label>
            <div className="relative">
              <input
                type="text"
                id="editModelName"
                value={form.modelName}
                onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                className={`${CSS_CLASSES.input} pl-3 pr-10 py-2 bg-white/50 dark:bg-gray-700/50 border-slate-300/70 dark:border-gray-600/70 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm`}
                placeholder="Enter a descriptive name for your model"
                disabled={appState.serverSetting.isUploading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="editEmbedder" className={CSS_CLASSES.label}>Embedder:</label>
            <select
              id="editEmbedder"
              value={form.embedder}
              onChange={(e) => setForm({ ...form, embedder: e.target.value })}
              className={CSS_CLASSES.select}
              disabled={appState.serverSetting.isUploading}
            >
              {Object.entries(appState.serverSetting.serverSetting.embedders || {})
                .filter(([_, embedder]) => embedder.downloaded === true)
                .length === 0 ? (
                <option value="">No downloaded embedders available</option>
              ) : (
                Object.entries(appState.serverSetting.serverSetting.embedders || {})
                  .filter(([_, embedder]) => embedder.downloaded === true)
                  .map(([key, embedder]) => (
                    <option key={key} value={key}>
                      {embedder.name}
                    </option>
                  ))
              )}
            </select>
          </div>
        </div>

        {/* Thumbnail file (optional replacement) */}
        <div>
          <label htmlFor="editThumbnailFile" className={CSS_CLASSES.label}>Thumbnail Image (Optional):</label>
          <input
            type="file"
            id="editThumbnailFile"
            accept="image/*"
            onChange={handleThumbnailFileChange}
            className={CSS_CLASSES.fileInput}
            disabled={appState.serverSetting.isUploading}
          />
        </div>

        {/* Thumbnail preview */}
        {thumbnailPreview && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setIsThumbnailExpanded(!isThumbnailExpanded)}
              className="flex items-center justify-between w-full text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
              disabled={appState.serverSetting.isUploading}
            >
              <span>Preview Thumbnail</span>
              <svg
                className={`ml-2 h-4 w-4 transition-transform duration-200 ${isThumbnailExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isThumbnailExpanded && (
              <div className="space-y-4 p-3 bg-slate-50 dark:bg-gray-800/30 rounded-lg border border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-gray-300">Preview Mode:</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPreviewMode('settings'); }}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${previewMode === 'settings' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-gray-700'} disabled:opacity-50`}
                      disabled={appState.serverSetting.isUploading}
                    >
                      Settings
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPreviewMode('list'); }}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${previewMode === 'list' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-gray-700'} disabled:opacity-50`}
                      disabled={appState.serverSetting.isUploading}
                    >
                      List
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center p-4">
                  <div className={`transition-all duration-200 ${previewMode === 'settings' ? 'w-32 h-32 rounded-full p-1.5 border-2 border-slate-300 dark:border-gray-500' : 'w-36 h-36 rounded-xl p-1.5 border border-slate-300 dark:border-gray-500'} bg-white dark:bg-gray-800 shadow-md overflow-hidden`}>
                    <img src={thumbnailPreview} alt="Thumbnail preview" className={`w-full h-full object-cover ${previewMode === 'settings' ? 'rounded-full' : 'rounded-lg'}`} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </GenericModal>
  );
}

export default EditModelModal;
