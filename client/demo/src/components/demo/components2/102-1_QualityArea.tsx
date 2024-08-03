import React, { useMemo } from "react";
import { useAppState } from "../../../001_provider/001_AppStateProvider";
import { F0Detector } from "@dannadori/voice-changer-client-js";
import { useGuiState } from "../001_GuiStateProvider";
import { useAppRoot } from "../../../001_provider/001_AppRootProvider";

export type QualityAreaProps = {
    detectors: string[];
};

export const QualityArea = (props: QualityAreaProps) => {
    const { setVoiceChangerClientSetting, serverSetting, setting } = useAppState();
    const { appGuiSettingState } = useAppRoot();
    const { isConverting, stateControls } = useGuiState();
    const edition = appGuiSettingState.edition;

    const qualityArea = useMemo(() => {
        if (!serverSetting.updateServerSettings || !setVoiceChangerClientSetting || !serverSetting.serverSetting || !setting) {
            return <></>;
        }

        const generateF0DetOptions = () => {
            if (edition.indexOf("DirectML") >= 0) {
                const recommended = ["crepe_full_onnx", "crepe_tiny_onnx", "rmvpe_onnx", "fcpe_onnx"];
                return Object.values(props.detectors).map((x) => {
                    if (recommended.includes(x)) {
                        return (
                            <option key={x} value={x}>
                                {x}
                            </option>
                        );
                    } else {
                        return (
                            <option key={x} value={x} disabled>
                                {x}(N/A)
                            </option>
                        );
                    }
                });
            } else {
                return Object.values(props.detectors).map((x) => {
                    return (
                        <option key={x} value={x}>
                            {x}
                        </option>
                    );
                });
            }
        };
        const f0DetOptions = generateF0DetOptions();

        const f0Det = (
            <div className="config-sub-area-control">
                <div className="config-sub-area-control-title"><a className="hint-text" data-tooltip-id="hint" data-tooltip-content="F0 Detector. A pitch extraction algorithm.">F0 Det.</a>:</div>
                <div className="config-sub-area-control-field">
                    <select
                        className="body-select"
                        value={serverSetting.serverSetting.f0Detector}
                        onChange={async (e) => {
                            stateControls.showWaitingCheckbox.updateState(true);
                            await serverSetting.updateServerSettings({ ...serverSetting.serverSetting, f0Detector: e.target.value as F0Detector });
                            stateControls.showWaitingCheckbox.updateState(false);
                        }}
                        disabled={isConverting}
                    >
                        {f0DetOptions}
                    </select>
                </div>
            </div>
        );

        const threshold = (
            <div className="config-sub-area-control">
                <div className="config-sub-area-control-title"><a className="hint-text" data-tooltip-id="hint" data-tooltip-content="Input sensitivity. The input volume required to activate the voice changer.">In. Sens.</a>:</div>
                <div className="config-sub-area-control-field">
                    <div className="config-sub-area-slider-control">
                        <span className="config-sub-area-slider-control-slider">
                            <input
                                type="range"
                                className="config-sub-area-slider-control-slider"
                                min="-90"
                                max="-60"
                                step="1"
                                value={serverSetting.serverSetting.silentThreshold}
                                onChange={(e) => {
                                    serverSetting.updateServerSettings({ ...serverSetting.serverSetting, silentThreshold: Number(e.target.value) });
                                }}
                            ></input>
                        </span>
                        <span className="config-sub-area-slider-control-val">{serverSetting.serverSetting.silentThreshold} dB</span>
                    </div>
                </div>
            </div>
        );

        return (
            <div className="config-sub-area">
                <div className="config-sub-area-control">
                    <div className="config-sub-area-control-title">NOISE:</div>
                    <div className="config-sub-area-control-field">
                        <div className="config-sub-area-noise-container">
                            <div className="config-sub-area-noise-checkbox-container">
                                <input
                                    type="checkbox"
                                    disabled={serverSetting.serverSetting.enableServerAudio != 0}
                                    checked={setting.voiceChangerClientSetting.echoCancel}
                                    onChange={(e) => {
                                        try {
                                            setVoiceChangerClientSetting({ ...setting.voiceChangerClientSetting, echoCancel: e.target.checked });
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }}
                                />{" "}
                                <span>Echo</span>
                            </div>
                            <div className="config-sub-area-noise-checkbox-container">
                                <input
                                    type="checkbox"
                                    disabled={serverSetting.serverSetting.enableServerAudio != 0}
                                    checked={setting.voiceChangerClientSetting.noiseSuppression}
                                    onChange={(e) => {
                                        try {
                                            setVoiceChangerClientSetting({ ...setting.voiceChangerClientSetting, noiseSuppression: e.target.checked });
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }}
                                />{" "}
                                <span>Sup1</span>
                            </div>
                            <div className="config-sub-area-noise-checkbox-container">
                                <input
                                    type="checkbox"
                                    disabled={serverSetting.serverSetting.enableServerAudio != 0}
                                    checked={setting.voiceChangerClientSetting.noiseSuppression2}
                                    onChange={(e) => {
                                        try {
                                            setVoiceChangerClientSetting({ ...setting.voiceChangerClientSetting, noiseSuppression2: e.target.checked });
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }}
                                />{" "}
                                <span>Sup2</span>
                            </div>
                        </div>
                    </div>
                </div>
                {f0Det}
                {threshold}
            </div>
        );
    }, [serverSetting.serverSetting, setting, serverSetting.updateServerSettings, setVoiceChangerClientSetting, isConverting]);

    return qualityArea;
};
