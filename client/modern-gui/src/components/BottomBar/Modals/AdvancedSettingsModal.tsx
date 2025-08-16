import { JSX, useState, useEffect } from 'react';
import { useAppState } from '../../../context/AppContext';
import { useUIContext } from '../../../context/UIContext';
import DebouncedSlider from '../../Helpers/DebouncedSlider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Protocol } from '@dannadori/voice-changer-client-js';
import GenericModal from '../../Modals/GenericModal';
import { CSS_CLASSES } from '../../../styles/constants';

interface AdvancedSettingsModalProps {
  showAdvancedSettings: boolean;
  setShowAdvancedSettings: (showAdvancedSettings: boolean) => void;
}

function AdvancedSettingsModal({ showAdvancedSettings, setShowAdvancedSettings }: AdvancedSettingsModalProps): JSX.Element {
  // ---------------- States ----------------
  const appState = useAppState();
  const uiState = useUIContext();

  const [localCrossFadeOverlapSize, setLocalCrossFadeOverlapSize] = useState<number>(
    appState.serverSetting?.serverSetting?.crossFadeOverlapSize ?? 0.02
  );
  const [localProtect, setLocalProtect] = useState<number>(
    appState.serverSetting?.serverSetting?.protect ?? 0
  );

  // ---------------- Hooks ----------------

  // Update local state when server settings change
  useEffect(() => {
    const crossFade = appState.serverSetting?.serverSetting?.crossFadeOverlapSize;
    if (crossFade != null) setLocalCrossFadeOverlapSize(crossFade);

    const protect = appState.serverSetting?.serverSetting?.protect;
    if (protect != null) setLocalProtect(protect);
  }, [appState.serverSetting?.serverSetting]);

  // ---------------- Handlers ----------------

  // Handle close modal
  const handleClose = () => {
    setShowAdvancedSettings(false);
  };

  // Handle cross fade overlap size change
  const handleCrossFadeOverlapSizeChange = async (val: number) => {
    await appState.serverSetting.updateServerSettings({
      ...appState.serverSetting.serverSetting,
      crossFadeOverlapSize: val
    });
    setLocalCrossFadeOverlapSize(val);
  };

  // Handle silence front change
  const handleSilenceFrontChange = async (val: boolean) => {
    const value = val ? 1 : 0;
    uiState.startLoading(`${value === 1 ? "Enabling" : "Disabling"} Silence Front`);
    await appState.serverSetting.updateServerSettings({ ...appState.serverSetting.serverSetting, silenceFront: value });
    uiState.stopLoading();
  };

  // Handle force fp32 change
  const handleForceFp32Change = async (val: boolean) => {
    const value = val ? 1 : 0;
    uiState.startLoading(`${value === 1 ? "Enabling" : "Disabling"} Force FP32 Mode`);
    await appState.serverSetting.updateServerSettings({ ...appState.serverSetting.serverSetting, forceFp32: value });
    uiState.stopLoading();
  };

  // Handle disable jit change
  const handleDisableJitChange = async (val: boolean) => {
    const value = val ? 1 : 0;
    uiState.startLoading(`${value === 1 ? "Disabling" : "Enabling"} JIT Compilation`);
    await appState.serverSetting.updateServerSettings({ ...appState.serverSetting.serverSetting, disableJit: value });
    uiState.stopLoading();
  };

  // Handle use onnx change
  const handleUseONNXChange = async (val: boolean) => {
    const value = val ? 1 : 0;
    uiState.startLoading(`${value === 1 ? "Enabling" : "Disabling"} Convert to ONNX`);
    await appState.serverSetting.updateServerSettings({ ...appState.serverSetting.serverSetting, useONNX: value });
    uiState.stopLoading();
  };

  // Handle protect change
  const handleProtectChange = async (val: number) => {
    await appState.serverSetting.updateServerSettings({
      ...appState.serverSetting.serverSetting,
      protect: val
    });
    setLocalProtect(val);
  };

  const handlePassThroughConfirmationSkipChange = async (val: boolean) => {
    appState.setVoiceChangerClientSetting({ ...appState.setting.voiceChangerClientSetting, passThroughConfirmationSkip: val });
  };

  // Handle UI mode switch
  const handleSwitchToClassicUI = async () => {
    try {
      uiState.startLoading("Switching to Classic UI...");
      
      const response = await fetch('/ui-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ui_mode: 'classic' })
      });

      if (response.ok) {
        // Reload the page to get the new UI
        window.location.reload();
      } else {
        console.error('Failed to switch UI mode');
        uiState.stopLoading();
      }
    } catch (error) {
      console.error('Error switching UI mode:', error);
      uiState.stopLoading();
    }
  };

  // ---------------- Render ----------------

  return (
    <GenericModal
      isOpen={showAdvancedSettings}
      onClose={handleClose}
      title="Advanced Settings"
      secondaryButton={{
        text: 'Close',
        onClick: handleClose,
        className: CSS_CLASSES.modalSecondaryButton,
        disabled: appState.serverSetting.isUploading
      }}
    >
      <div className="space-y-4 py-2">
        <div>
          <label htmlFor="uiLanguage" className={CSS_CLASSES.label}>UI Language</label>
          <select
            id="uiLanguage"
            className={CSS_CLASSES.select}
            value={(appState.setting as any)?.uiLanguage || 'en'}
            onChange={(e) => {
              console.log('UI Language selected:', e.target.value);
              // Not implemented
            }}
          >
            <option value="en">🇬🇧 English</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="ja">🇯🇵 日本語</option>
          </select>
        </div>

        <div>
          <label htmlFor="protocol" className={CSS_CLASSES.label}>Protocol</label>
          <select id="protocol" className={CSS_CLASSES.select}
            value={appState.setting.workletNodeSetting.protocol}
            onChange={e => appState.setWorkletNodeSetting({ ...appState.setting.workletNodeSetting, protocol: e.target.value as Protocol })}
          >
            <option value="sio">sio</option>
            <option value="rest">rest</option>
          </select>
        </div>
        <div>
          <label htmlFor="crossfade" className={CSS_CLASSES.label}>Crossfade Overlap</label>
          <DebouncedSlider id="crossfade" name="crossfade"
            min={0.05} max={0.2} step={0.01}
            value={localCrossFadeOverlapSize}
            className={CSS_CLASSES.range}
            onImmediateChange={setLocalCrossFadeOverlapSize}
            onChange={async val => { handleCrossFadeOverlapSizeChange(val); }}
          />
          <p className="text-xs text-slate-600 dark:text-gray-400 text-right">{localCrossFadeOverlapSize.toFixed(2)} s</p>
        </div>
        <div>
          <label className={CSS_CLASSES.checkboxLabel}>
            <input type="checkbox" className="mr-2 accent-blue-500 dark:accent-blue-400"
              checked={appState.serverSetting.serverSetting.silenceFront === 1}
              onChange={async e => { handleSilenceFrontChange(e.target.checked) }}
            />
            Silence Front
          </label>
        </div>
        <div>
          <label className={CSS_CLASSES.checkboxLabel}>
            <input type="checkbox" className="mr-2 accent-blue-500 dark:accent-blue-400"
              checked={appState.serverSetting.serverSetting.forceFp32 === 1}
              onChange={async e => { handleForceFp32Change(e.target.checked) }}
            />
            Force FP32 Mode
          </label>
        </div>
        <div>
          <label className={CSS_CLASSES.checkboxLabel}>
            <input type="checkbox" className="mr-2 accent-blue-500 dark:accent-blue-400"
              checked={appState.serverSetting.serverSetting.disableJit === 1}
              onChange={async e => { handleDisableJitChange(e.target.checked) }}
            />
            Disable JIT Compilation
          </label>
        </div>
        <div>
          <label className={CSS_CLASSES.checkboxLabel}>
            <input type="checkbox" className="mr-2 accent-blue-500 dark:accent-blue-400"
              checked={appState.serverSetting.serverSetting.useONNX === 1}
              onChange={async e => { handleUseONNXChange(e.target.checked) }}
            />
            Convert to ONNX
          </label>
        </div>
        <div>
          <label htmlFor="protect" className={CSS_CLASSES.label}>Protect</label>
          <DebouncedSlider id="protect" name="protect"
            min={0} max={0.5} step={0.01}
            value={localProtect}
            className={CSS_CLASSES.range}
            onImmediateChange={setLocalProtect}
            onChange={async val => { handleProtectChange(val) }}
          />
          <p className="text-xs text-slate-600 dark:text-gray-400 text-right">{localProtect.toFixed(2)}</p>
        </div>
        <div className="border border-blue-500 p-3 rounded bg-blue-50 dark:bg-blue-900/20 space-y-2">
          <div className="flex items-center text-blue-600 mb-2">
            <span className="font-semibold">Interface</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-gray-400">
              Currently using: <span className="font-medium text-blue-600 dark:text-blue-400">Modern UI</span>
            </p>
            <button
              type="button"
              onClick={handleSwitchToClassicUI}
              disabled={appState.serverSetting.isUploading}
              className="w-full px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md transition-colors duration-150 disabled:cursor-not-allowed"
            >
              Switch to Classic UI
            </button>
          </div>
        </div>

        <div className="border border-red-500 p-3 rounded bg-red-50 dark:bg-red-900/20 space-y-2">
          <div className="flex items-center text-red-600 mb-2">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
            <span className="font-semibold">Danger Zone</span>
          </div>
          <label className={CSS_CLASSES.checkboxLabel}>
            <input type="checkbox" className="mr-2 accent-red-500 dark:accent-red-400"
              checked={appState.setting.voiceChangerClientSetting.passThroughConfirmationSkip}
              onChange={e => handlePassThroughConfirmationSkipChange(e.target.checked)}
            />
            Skip Pass through confirmation
          </label>
        </div>
      </div>
    </GenericModal>
  );
}

export default AdvancedSettingsModal;