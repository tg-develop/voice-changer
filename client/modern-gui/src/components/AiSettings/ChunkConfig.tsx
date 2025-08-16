import { useEffect, useState } from "react";
import { CSS_CLASSES } from "../../styles/constants";
import DebouncedSlider from "../Helpers/DebouncedSlider";
import { ClientState } from "@dannadori/voice-changer-client-js";
import { UIContextType } from "../../context/UIContext";

interface ChunkConfigProps {
    appState: ClientState;
    uiState: UIContextType;
}

function ChunkConfig({ appState, uiState }: ChunkConfigProps) {
    // ---------------- States ----------------
    const [localChunkSize, setLocalChunkSize] = useState<number>(
        appState.serverSetting?.serverSetting?.serverReadChunkSize
            ? appState.serverSetting.serverSetting.serverReadChunkSize
            : 5
    );
    const [localExtraSize, setLocalExtraSize] = useState<number>(
        appState.serverSetting?.serverSetting?.extraConvertSize ?? 1
    );

    // ---------------- Hooks ----------------

    // Set local chunk size
    useEffect(() => {
        const cs = appState.serverSetting?.serverSetting?.serverReadChunkSize;
        setLocalChunkSize(cs);
    }, [appState.serverSetting?.serverSetting?.serverReadChunkSize]);

    // Set local extra size
    useEffect(() => {
        const ex = appState.serverSetting?.serverSetting?.extraConvertSize;
        setLocalExtraSize(ex);
    }, [appState.serverSetting?.serverSetting?.extraConvertSize]);

    // ---------------- Handlers ----------------

    // Handle chunk size change
    const handleChangeChunkSize = (value: number) => {
        setLocalChunkSize(value);
        appState.setWorkletNodeSetting({ ...appState.setting.workletNodeSetting, inputChunkNum: Number(value) });
        appState.trancateBuffer();
        appState.serverSetting.updateServerSettings({
            ...appState.serverSetting?.serverSetting,
            serverReadChunkSize: value
        });
    };

    // Handle extra size change
    const handleChangeExtraSize = (value: number) => {
        setLocalExtraSize(value);
        appState.serverSetting.updateServerSettings({
            ...appState.serverSetting?.serverSetting,
            extraConvertSize: value
        });
    };

    // ---------------- Render ----------------

    return (
        <>
            <div>
                <label htmlFor="chunk" className={CSS_CLASSES.label}>Chunk Size:</label>
                <DebouncedSlider
                    id="chunk"
                    name="chunk"
                    min={1}
                    max={1024}
                    step={1}
                    value={localChunkSize}
                    className={`${CSS_CLASSES.range} ${uiState.isConverting ? CSS_CLASSES.rangeDisabled : ""}`}
                    onImmediateChange={setLocalChunkSize}
                    onChange={handleChangeChunkSize}
                    disabled={uiState.isConverting}
                />
                <p className={CSS_CLASSES.sliderValue}>{((localChunkSize * 128 * 1000) / 48000).toFixed(1)}ms</p>
            </div>
            <div>
                <label htmlFor="extra" className={CSS_CLASSES.label}>Extra Processing Time (Extra):</label>
                <DebouncedSlider
                    id="extra"
                    name="extra"
                    min={0}
                    max={5}
                    step={0.1}
                    value={localExtraSize}
                    className={`${CSS_CLASSES.range} ${uiState.isConverting ? CSS_CLASSES.rangeDisabled : ""}`}
                    onImmediateChange={setLocalExtraSize}
                    onChange={handleChangeExtraSize}
                    disabled={uiState.isConverting}
                />
                <p className={CSS_CLASSES.sliderValue}>{localExtraSize} s</p>
            </div>
        </>
    )
}

export default ChunkConfig;