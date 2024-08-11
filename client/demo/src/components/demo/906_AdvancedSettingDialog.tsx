import React, { useMemo } from "react";
import { useGuiState } from "./001_GuiStateProvider";
import { useAppState } from "../../001_provider/001_AppStateProvider";
import { Protocol } from "@dannadori/voice-changer-client-js";

export const AdvancedSettingDialog = () => {
    const guiState = useGuiState();
    const { setting, serverSetting, setWorkletNodeSetting, setWorkletSetting, setVoiceChangerClientSetting } = useAppState();
    const dialog = useMemo(() => {
        const closeButtonRow = (
            <div className="body-row split-3-4-3 left-padding-1">
                <div className="body-item-text"></div>
                <div className="body-button-container body-button-container-space-around">
                    <div
                        className="body-button"
                        onClick={() => {
                            guiState.stateControls.showAdvancedSettingCheckbox.updateState(false);
                        }}
                    >
                        close
                    </div>
                </div>
                <div className="body-item-text"></div>
            </div>
        );

        const onProtocolChanged = async (val: Protocol) => {
            setWorkletNodeSetting({ ...setting.workletNodeSetting, protocol: val });
        };
        const protocolRow = (
            <div className="advanced-setting-container-row">
                <div className="advanced-setting-container-row-title"><a className="hint-text" data-tooltip-id="hint" data-tooltip-content="Communication protocol between the user interface and server. 'sio' is the recommended.">Protocol</a></div>
                <div className="advanced-setting-container-row-field">
                    <select
                        value={setting.workletNodeSetting.protocol}
                        onChange={(e) => {
                            onProtocolChanged(e.target.value as Protocol);
                        }}
                    >
                        {Object.values(Protocol).map((x) => {
                            return (
                                <option key={x} value={x}>
                                    {x}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>
        );
        const crossfaceRow = (
            <div className="advanced-setting-container-row">
                <div className="advanced-setting-container-row-title">Crossfade length</div>
                <div className="advanced-setting-container-row-field">
                    <div>
                        <input
                            type="range"
                            className="body-item-input-slider"
                            min="0.05"
                            max="0.20"
                            step="0.01"
                            value={serverSetting.serverSetting.crossFadeOverlapSize}
                            onChange={(e) => {
                                serverSetting.updateServerSettings({ ...serverSetting.serverSetting, crossFadeOverlapSize: Number(e.target.value) });
                                guiState.setVoiceChangerSettingsChanged(true);
                            }}
                            disabled={guiState.isConverting}
                        ></input>
                        <span className="body-item-input-slider-val">{serverSetting.serverSetting.crossFadeOverlapSize} s</span>
                    </div>
                </div>
            </div>
        );

        const onSilenceFrontChanged = (val: number) => {
            serverSetting.updateServerSettings({
                ...serverSetting.serverSetting,
                silenceFront: val,
            });
        };
        const silenceFrontRow = (
            <div className="advanced-setting-container-row">
                <div className="advanced-setting-container-row-title"><a className="hint-text" data-tooltip-id="hint" data-tooltip-content="An optimization option that removes 'Extra' part during pitch extraction. Recommended to keep it 'on'.">SilenceFront</a></div>
                <div className="advanced-setting-container-row-field">
                    <select
                        value={serverSetting.serverSetting.silenceFront}
                        onChange={(e) => {
                            onSilenceFrontChanged(Number(e.target.value));
                        }}
                        disabled={guiState.isConverting}
                    >
                        <option value="0">off</option>
                        <option value="1">on</option>
                    </select>
                </div>
            </div>
        );

        const onForceFp32ModeChanged = async (val: number) => {
            return serverSetting.updateServerSettings({
                ...serverSetting.serverSetting,
                forceFp32: val,
            });
        };
        const forceFp32ModeRow = (
            <div className="advanced-setting-container-row">
                <div className="advanced-setting-container-row-title"><a className="hint-text" data-tooltip-id="hint" data-tooltip-content="A debugging option that forces inference with full precision instead of half precision. Has no effect if GPU does not support FP16 (indicated in the command line logs). Set to 'off' only if you experience issues in FP16 mode.">Force FP32 mode</a></div>
                <div className="advanced-setting-container-row-field">
                    <select
                        value={serverSetting.serverSetting.forceFp32}
                        onChange={async (e) => {
                            guiState.stateControls.showWaitingCheckbox.updateState(true);
                            await onForceFp32ModeChanged(Number(e.target.value));
                            // Switching between FP16-FP32 reloads models and buffers.
                            guiState.setVoiceChangerSettingsChanged(false);
                            guiState.stateControls.showWaitingCheckbox.updateState(false);
                        }}
                        disabled={guiState.isConverting}
                    >
                        <option value="0">off</option>
                        <option value="1">on</option>
                    </select>
                </div>
            </div>
        );

        const onDisableJitChanged = async (val: number) => {
            return serverSetting.updateServerSettings({
                ...serverSetting.serverSetting,
                disableJit: val,
            });
        };
        const disableJitRow = (
            <div className="advanced-setting-container-row">
                <div className="advanced-setting-container-row-title"><a className="hint-text" data-tooltip-id="hint" data-tooltip-content="A debugging option that disables Just-in-Time (JIT) compilation for PyTorch models. Disabling this option will reduce model loading time, but may decrease performance. Has no effect on DirectML devices.">Disable JIT compilation</a></div>
                <div className="advanced-setting-container-row-field">
                    <select
                        value={serverSetting.serverSetting.disableJit}
                        onChange={async (e) => {
                            guiState.stateControls.showWaitingCheckbox.updateState(true);
                            await onDisableJitChanged(Number(e.target.value));
                            guiState.setVoiceChangerSettingsChanged(false);
                            guiState.stateControls.showWaitingCheckbox.updateState(false);
                        }}
                        disabled={guiState.isConverting}
                    >
                        <option value="0">off</option>
                        <option value="1">on</option>
                    </select>
                </div>
            </div>
        );

        const convertToOnnx = (
            <div className="advanced-setting-container-row">
                <div className="advanced-setting-container-row-title"><a className="hint-text" data-tooltip-id="hint" data-tooltip-content="Automatically converts models into ONNX format. Note that model conversion is performed once and may take 1-2 minutes. Recommended for DirectML version and inference on CPU.">Convert to ONNX</a></div>
                <div className="advanced-setting-container-row-field">
                    <input
                        type="checkbox"
                        checked={Boolean(serverSetting.serverSetting.useONNX)}
                        onChange={async (e) => {
                            guiState.stateControls.showWaitingCheckbox.updateState(true);
                            await serverSetting.updateServerSettings({ ...serverSetting.serverSetting, useONNX: Number(e.target.checked) });
                            guiState.stateControls.showWaitingCheckbox.updateState(false);
                        }}
                        disabled={guiState.isConverting}
                    />
                </div>
            </div>
        );

        const protectRow = (
            <div className="advanced-setting-container-row">
                <div className="advanced-setting-container-row-title"><a className="hint-text" data-tooltip-id="hint" data-tooltip-content="Voiceless consonants protection. Has no effect when set to 0.5 or when 'Index' is inactive.">Protect</a></div>
                <div className="advanced-setting-container-row-field">
                    <div>
                        <input
                            type="range"
                            className="body-item-input-slider"
                            min="0"
                            max="0.5"
                            step="0.01"
                            value={serverSetting.serverSetting.protect || 0}
                            onChange={(e) => {
                                serverSetting.updateServerSettings({ ...serverSetting.serverSetting, protect: Number(e.target.value) });
                            }}
                        ></input>
                        <span className="body-item-input-slider-val">{serverSetting.serverSetting.protect}</span>
                    </div>
                </div>
            </div>
        );

        const skipPassThroughConfirmationRow = (
            <div className="advanced-setting-container-row">
                <div className="advanced-setting-container-row-title-long">Skip Pass through confirmation</div>
                <div className="advanced-setting-container-row-field">
                    <select
                        value={setting.voiceChangerClientSetting.passThroughConfirmationSkip ? "1" : "0"}
                        onChange={(e) => {
                            setVoiceChangerClientSetting({ ...setting.voiceChangerClientSetting, passThroughConfirmationSkip: e.target.value == "1" ? true : false });
                        }}
                    >
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                    </select>
                </div>
            </div>
        );
        const content = (
            <div className="advanced-setting-container">
                {protocolRow}
                {crossfaceRow}
                {silenceFrontRow}
                {forceFp32ModeRow}
                {disableJitRow}
                {convertToOnnx}
                {protectRow}
                {skipPassThroughConfirmationRow}
            </div>
        );

        return (
            <div className="dialog-frame">
                <div className="dialog-title">Advanced Setting</div>
                <div className="dialog-content">
                    {content}
                    {closeButtonRow}
                </div>
            </div>
        );
    }, [serverSetting.serverSetting, serverSetting.updateServerSettings, setting.workletNodeSetting, setWorkletNodeSetting, setting.workletSetting, setWorkletSetting, guiState.isConverting]);
    return dialog;
};
