import { UIContextType } from "../../context/UIContext";
import { AppGuiSettingState } from "../../scripts/useAppGuiSetting";
import { CSS_CLASSES } from "../../styles/constants";
import { ClientState } from "@dannadori/voice-changer-client-js";
import { F0Detector } from "@dannadori/voice-changer-client-js";

interface F0ExtractionProps {
    appState: ClientState;
    uiState: UIContextType;
    appGuiSettingState: AppGuiSettingState;
}

// Use pitchExtractors from server settings instead of hardcoded list

function F0Extraction({ appState, uiState, appGuiSettingState }: F0ExtractionProps) {
    // ---------------- Handlers ----------------

    // Handle F0 Detector Change
    const handleChangeF0Detector = async (value: string) => {
        uiState.startLoading(`Changing F0 Detector to ${value}`);
        await appState.serverSetting.updateServerSettings({
            ...appState.serverSetting?.serverSetting,
            f0Detector: value as F0Detector
        });
        uiState.stopLoading();
    };

    // ---------------- Functions ----------------

    // Generate F0 Detectors Options for Select
    const generateF0DetOptions = () => {
        const pitchExtractors = appState.serverSetting.serverSetting.pitchExtractors || {};
        
        // Get all available extractors and filter for downloaded ones
        let extractors = Object.entries(pitchExtractors)
            .filter(([_, extractor]) => extractor.downloaded === true);
        
        // Filter for DirectML - only include ONNX models
        if (appGuiSettingState.serverInfo.edition.indexOf("DirectML") >= 0) {
            extractors = extractors.filter(([key]) => key.includes('_onnx'));
        }
        
        // If no downloaded extractors are available
        if (extractors.length === 0) {
            return <option value="">No downloaded pitch extractors available</option>;
        }
        
        // Map to options
        return extractors.map(([key, extractor]) => (
            <option key={key} value={key}>
                {extractor.name}
            </option>
        ));
    };

    // ---------------- Render ----------------

    return (
        <div>
            <label htmlFor="f0Detector" className={CSS_CLASSES.label}>Pitch Extraction Algorithm</label>
            <select
                id="f0Detector"
                className={CSS_CLASSES.select}
                value={appState.serverSetting?.serverSetting?.f0Detector ?? ''}
                disabled={uiState.isConverting}
                onChange={async (e) => { handleChangeF0Detector(e.target.value) }}
            >
                {generateF0DetOptions()}
            </select>
        </div>
    );
}

export default F0Extraction;