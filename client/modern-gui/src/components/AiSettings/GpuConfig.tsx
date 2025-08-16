
import { CSS_CLASSES } from "../../styles/constants";
import { ClientState } from "@dannadori/voice-changer-client-js";
import { UIContextType } from "../../context/UIContext";

interface GpuInfo {
    id: number;
    name: string;
    backend?: string;
    memory?: number;
}

interface GPUConfigProps {
    appState: ClientState;
    uiState: UIContextType;
}

function GPUConfig({ appState, uiState }: GPUConfigProps) {
    // ---------------- Handlers ----------------

    // Handle GPU Change
    const handleChangeGpu = async (gpuId: number) => {
        uiState.startLoading(`Changing to Processing Unit: ${appState.serverSetting?.serverSetting?.gpus?.find(gpu => gpu.id === gpuId)?.name}`);
        await appState.serverSetting.updateServerSettings({
            ...appState.serverSetting?.serverSetting,
            gpu: gpuId
        });
        uiState.stopLoading();
    };

    // ---------------- Render ----------------

    return (
        <div>
            <label htmlFor="gpu" className={CSS_CLASSES.label}>Processing Unit (GPU):</label>
            <select
                id="gpu"
                name="gpu"
                className={CSS_CLASSES.select}
                value={appState.serverSetting?.serverSetting?.gpu ?? -1}
                onChange={async (e) => { handleChangeGpu(parseInt(e.target.value)); }}
            >
                {appState.serverSetting?.serverSetting?.gpus?.length && appState.serverSetting?.serverSetting?.gpus?.length > 0 ? (
                    appState.serverSetting?.serverSetting?.gpus?.map((gpu: GpuInfo) =>
                        <option key={gpu.id} value={gpu.id}>
                            {`${gpu.name} ${gpu.memory ? `(${(gpu.memory / 1024 / 1024 / 1024).toFixed(0)} GB)` : ""}`}
                        </option>)
                ) : (
                    <option value="-1" disabled>No GPUs available</option>
                )}
            </select>
        </div>
    )
}

export default GPUConfig;
