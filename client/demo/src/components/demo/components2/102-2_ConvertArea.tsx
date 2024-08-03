import React, { useMemo } from "react";
import { useAppState } from "../../../001_provider/001_AppStateProvider";
import { useAppRoot } from "../../../001_provider/001_AppRootProvider";
import { useGuiState } from "../001_GuiStateProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type ConvertProps = {
    inputChunkNums: number[];
};

export const ConvertArea = (props: ConvertProps) => {
    const { setting, serverSetting, setWorkletNodeSetting, trancateBuffer } = useAppState();
    const { isConverting, stateControls, voiceChangerSettingsChanged, setVoiceChangerSettingsChanged } = useGuiState();
    const { appGuiSettingState } = useAppRoot();
    const edition = appGuiSettingState.edition;

    const convertArea = useMemo(() => {
        let nums: number[];
        if (!props.inputChunkNums) {
            nums = [8, 16, 24, 32, 40, 48, 64, 80, 96, 112, 128, 192, 256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960, 1024, 2048, 4096, 8192, 16384];
        } else {
            nums = props.inputChunkNums;
        }
        if (serverSetting.serverSetting.maxInputLength) {
            nums = nums.filter((x) => {
                return x < serverSetting.serverSetting.maxInputLength / 128;
            });
        }

        const gpusEntry = serverSetting.serverSetting.gpus;

        const gpuSelect = (
                <div className="config-sub-area-control">
                    <div className="config-sub-area-control-title">
                        <a className="hint-text" data-tooltip-id="hint" data-tooltip-content="Change to CPU then back to GPU." style={{ display: edition === "DirectML" && serverSetting.serverSetting.gpu !== -1 && voiceChangerSettingsChanged ? undefined : "none" }}><FontAwesomeIcon icon="warning" style={{ fontSize: "1rem" }} /></a> GPU:
                    </div>
                    <div className="config-sub-area-control-field">
                        <select
                            className="body-select"
                            value={serverSetting.serverSetting.gpu}
                            onChange={async (e) => {
                                stateControls.showWaitingCheckbox.updateState(true);
                                await serverSetting.updateServerSettings({ ...serverSetting.serverSetting, gpu: Number(e.target.value) });
                                setVoiceChangerSettingsChanged(false);
                                stateControls.showWaitingCheckbox.updateState(false);
                            }}
                            disabled={isConverting}
                        >
                            {gpusEntry.map((x) => {
                                return (
                                    <option key={x.id} value={x.id}>
                                        {x.name}
                                        {x.memory ? `(${(x.memory / 1024 / 1024 / 1024).toFixed(0)}GB)` : ""}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            );

        const extraArea = (
            <div className="config-sub-area-control">
                <div className="config-sub-area-control-title"><a className="hint-text" data-tooltip-id="hint" data-tooltip-content="Extra is an extra audio history that will be used for voice conversion. Does not affect the delay. More extra - better voice quality, more GPU usage. Less extra - vice versa.">EXTRA</a>:</div>
                <div className="config-sub-area-control-field">
                    <div className="config-sub-area-slider-control">
                        <input
                            className="config-sub-area-slider-control-slider"
                            type="range"
                            min={0.1}
                            max={5}
                            step={0.1}
                            value={serverSetting.serverSetting.extraConvertSize}
                            disabled={isConverting}
                            onChange={(e) => {
                                serverSetting.updateServerSettings({ ...serverSetting.serverSetting, extraConvertSize: Number(e.target.value) });
                                setVoiceChangerSettingsChanged(true);
                            }} />
                        <span className="config-sub-area-slider-control-val">{serverSetting.serverSetting.extraConvertSize} s</span>
                    </div>
                </div>
            </div>
        );
        return (
            <div className="config-sub-area">
                <div className="config-sub-area-control">
                    <div className="config-sub-area-control-title"><a className="hint-text" data-tooltip-id="hint" data-tooltip-content="Chunk size is an audio buffer. Controls the delay and GPU usage. More chunk - more delay, less GPU usage. Less chunk - vice versa.">CHUNK</a>:</div>
                    <div className="config-sub-area-control-field">
                        <div className="config-sub-area-slider-control">
                            <input
                                className="config-sub-area-slider-control-slider"
                                type="range"
                                min={1}
                                max={1024}
                                step={1}
                                value={serverSetting.serverSetting.serverReadChunkSize}
                                disabled={isConverting}
                                onChange={(e) => {
                                    setWorkletNodeSetting({ ...setting.workletNodeSetting, inputChunkNum: Number(e.target.value) });
                                    trancateBuffer();
                                    serverSetting.updateServerSettings({ ...serverSetting.serverSetting, serverReadChunkSize: Number(e.target.value) });
                                    setVoiceChangerSettingsChanged(true);
                                }} />
                            <span className="config-sub-area-slider-control-val">{((serverSetting.serverSetting.serverReadChunkSize * 128 * 1000) / 48000).toFixed(1)} ms</span>
                        </div>
                    </div>
                </div>
                {extraArea}
                {gpuSelect}
            </div>
        );
    }, [serverSetting.serverSetting, setting, serverSetting.updateServerSettings, setWorkletNodeSetting, edition, isConverting, voiceChangerSettingsChanged]);

    return convertArea;
};
