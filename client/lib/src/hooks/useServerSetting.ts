import { useState, useMemo } from "react";
import { VoiceChangerServerSetting, ServerInfo, ServerSettingKey, OnnxExporterInfo, MergeModelRequest, VoiceChangerType, DefaultServerSetting } from "../const";
import { VoiceChangerClient } from "../VoiceChangerClient";

export const ModelAssetName = {
    iconFile: "iconFile",
} as const;
export type ModelAssetName = (typeof ModelAssetName)[keyof typeof ModelAssetName];

export const ModelFileKind = {
    rvcModel: "rvcModel",
    rvcIndex: "rvcIndex",
} as const;
export type ModelFileKind = (typeof ModelFileKind)[keyof typeof ModelFileKind];

export type ModelFile = {
    file: File;
    kind: ModelFileKind;
    dir: string;
};

export type ModelUploadSetting = {
    voiceChangerType: VoiceChangerType;
    slot: number;
    files: ModelFile[];
    embedder: string
    params: any;
};
export type ModelFileForServer = Omit<ModelFile, "file"> & {
    name: string;
    kind: ModelFileKind;
};
export type ModelUploadSettingForServer = Omit<ModelUploadSetting, "files"> & {
    files: ModelFileForServer[];
};


export type BackgroundSoundsFile = {
    file: File;
    dir: string;
};

export type BackgroundSoundsUploadSetting = {
    file: BackgroundSoundsFile;
    params: any;
};
export type BackgroundSoundsFileForServer = Omit<BackgroundSoundsFile, "file"> & {
    name: string;
};
export type BackgroundSoundsUploadSettingForServer = Omit<BackgroundSoundsUploadSetting, "file"> & {
    file: BackgroundSoundsFileForServer;
};


type AssetUploadSetting = {
    slot: number;
    name: ModelAssetName;
    file: string;
};

export type UseServerSettingProps = {
    voiceChangerClient: VoiceChangerClient | null;
};

export type ServerSettingState = {
    serverSetting: ServerInfo;
    updateServerSettings: (setting: ServerInfo) => Promise<void>;
    reloadServerInfo: () => Promise<any>;
    uploadBackgroundSound: (setting: BackgroundSoundsUploadSetting) => Promise<void>;
    uploadModel: (setting: ModelUploadSetting) => Promise<ServerInfo>;
    deleteModel: (slot: number) => Promise<void>;
    uploadProgress: number;
    isUploading: boolean;

    getOnnx: () => Promise<OnnxExporterInfo>;
    mergeModel: (request: MergeModelRequest) => Promise<ServerInfo>;
    updateModelDefault: () => Promise<ServerInfo>;
    updateModelInfo: (slot: number, key: string, val: string) => Promise<ServerInfo>;
    updateSoundInfo: (slot: string, key: string, val: string) => Promise<ServerInfo>;
    deleteSound: (soundId: string) => Promise<ServerInfo>;
    uploadAssets: (slot: number, name: ModelAssetName, file: File) => Promise<void>;

    //Pretrained
    downloadPretrained: (model_key: string) => Promise<ServerInfo>;
    deletePretrained: (model_key: string) => Promise<ServerInfo>;
};

export const useServerSetting = (props: UseServerSettingProps): ServerSettingState => {
    const [serverSetting, _setServerSetting] = useState<ServerInfo>(DefaultServerSetting);
    const setServerSetting = (info: ServerInfo | null) => {
        if (!info || !(info as any).modelSlots) {
            // サーバが情報を空で返したとき。Web版対策
            return;
        }
        _setServerSetting((prev) => {
            if (!prev) return info as ServerInfo;
            // If modelSlots are structurally identical, preserve previous array reference
            const prevSlots = prev.modelSlots ?? [];
            const nextSlots = (info as ServerInfo).modelSlots ?? [];
            const slotsEqual = JSON.stringify(prevSlots) === JSON.stringify(nextSlots);
            const stableSlots = slotsEqual ? prevSlots : nextSlots;
            return { ...(info as ServerInfo), modelSlots: stableSlots } as ServerInfo;
        });
    };

    //////////////
    // 設定
    /////////////
    const updateServerSettings = useMemo(() => {
        return async (setting: ServerInfo) => {
            if (!props.voiceChangerClient) return;
            let latestRes: ServerInfo | null = null;
            // Filter enum values to only strings to avoid numeric reverse mappings
            const stringKeys = (Object.values(ServerSettingKey).filter((v) => typeof v === 'string') as string[]) as (keyof VoiceChangerServerSetting)[];
            for (let i = 0; i < stringKeys.length; i++) {
                const k = stringKeys[i] as keyof VoiceChangerServerSetting;
                const cur_v = serverSetting[k];
                const new_v = setting[k];

                // Deep comparison for objects, simple comparison for primitives
                const hasChanged = (k === 'audioEffects' || k === 'audioBackgrounds')
                    ? JSON.stringify(cur_v) !== JSON.stringify(new_v)
                    : cur_v != new_v;

                if (hasChanged) {
                    // Serialize objects as JSON, convert primitives to string
                    const valueToSend = ((k === 'audioEffects' || k === 'audioBackgrounds') && typeof new_v === 'object')
                        ? JSON.stringify(new_v)
                        : "" + new_v;
                    
                    const res = await props.voiceChangerClient.updateServerSettings(k, valueToSend);
                    latestRes = res as ServerInfo;
                }
            }
            if (latestRes) {
                setServerSetting(latestRes);
            }
        };
    }, [props.voiceChangerClient, serverSetting]);

    //////////////
    // 操作
    /////////////
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    // (e) モデルアップロード
    const _uploadFile2 = useMemo(() => {
        return async (file: File, onprogress: (progress: number, end: boolean) => void, dir: string = "") => {
            if (!props.voiceChangerClient) return;
            await props.voiceChangerClient.uploadFile2(dir, file, onprogress);
        };
    }, [props.voiceChangerClient]);

    // 新しいアップローダ
    const uploadModel = useMemo(() => {
        return async (setting: ModelUploadSetting): Promise<ServerInfo> => {
            if (!props.voiceChangerClient) {
                throw new Error('Voice changer client not initialized');
            }

            setUploadProgress(0);
            setIsUploading(true);

            const progRate = 1 / setting.files.length;
            for (let i = 0; i < setting.files.length; i++) {
                const progOffset = 100 * i * progRate;
                await _uploadFile2(
                    setting.files[i].file,
                    (progress: number, _end: boolean) => {
                        setUploadProgress(progress * progRate + progOffset);
                    },
                    setting.files[i].dir
                );
            }
            const params: ModelUploadSettingForServer = {
                voiceChangerType: setting.voiceChangerType,
                slot: setting.slot,
                params: setting.params,
                embedder: setting.embedder,
                files: setting.files.map((f) => ({
                    name: f.file.name,
                    kind: f.kind,
                    dir: f.dir
                }))
            };

            await props.voiceChangerClient.loadModel(0, false, JSON.stringify(params));

            setUploadProgress(0);
            setIsUploading(false);
            const serverInfo = await reloadServerInfo();
            if (!serverInfo) {
                throw new Error('Failed to reload server info after model upload');
            }
            return serverInfo;
        };
    }, [props.voiceChangerClient]);

    const deleteModel = useMemo(() => {
        return async (slot: number) => {
            if (!props.voiceChangerClient) {
                return;
            }
            await props.voiceChangerClient.deleteModel(slot);
            reloadServerInfo();
        };
    }, [props.voiceChangerClient]);

    const uploadBackgroundSound = useMemo(() => {
        return async (setting: BackgroundSoundsUploadSetting) => {
            if (!props.voiceChangerClient) {
                return;
            }

            setUploadProgress(0);
            setIsUploading(true);

            await _uploadFile2(
                setting.file.file,
                (progress: number, _end: boolean) => {
                    setUploadProgress(progress);
                },
                ""
            );

            const params: BackgroundSoundsUploadSettingForServer = {
                ...setting,
                file: { name: setting.file.file.name, dir: setting.file.dir },
            };

            const loadPromise = props.voiceChangerClient.loadSound(JSON.stringify(params));
            await loadPromise;

            setUploadProgress(0);
            setIsUploading(false);
        };
    }, [props.voiceChangerClient]);


    const uploadAssets = useMemo(() => {
        return async (slot: number, name: ModelAssetName, file: File) => {
            if (!props.voiceChangerClient) return;

            await _uploadFile2(file, (progress: number, _end: boolean) => {
                console.log(progress, _end);
            });
            const assetUploadSetting: AssetUploadSetting = {
                slot,
                name,
                file: file.name,
            };
            await props.voiceChangerClient.uploadAssets(JSON.stringify(assetUploadSetting));
            reloadServerInfo();
        };
    }, [props.voiceChangerClient]);

    const reloadServerInfo = useMemo(() => {
        return async () => {
            if (!props.voiceChangerClient) return;
            const res = await props.voiceChangerClient.getServerSettings();
            setServerSetting(res);
            return res;
        };
    }, [props.voiceChangerClient]);

    const getOnnx = async () => {
        return props.voiceChangerClient!.getOnnx();
    };

    const mergeModel = async (request: MergeModelRequest) => {
        const serverInfo = await props.voiceChangerClient!.mergeModel(request);
        setServerSetting(serverInfo);
        return serverInfo;
    };

    const updateModelDefault = async () => {
        const serverInfo = await props.voiceChangerClient!.updateModelDefault();
        setServerSetting(serverInfo);
        return serverInfo;
    };
    const updateModelInfo = async (slot: number, key: string, val: string) => {
        const serverInfo = await props.voiceChangerClient!.updateModelInfo(slot, key, val);
        setServerSetting(serverInfo);
        return serverInfo;
    };

    const updateSoundInfo = async (slot: string, key: string, val: string) => {
        const serverInfo = await props.voiceChangerClient!.updateSoundInfo(slot, key, val);
        setServerSetting(serverInfo);
        return serverInfo;
    };
    const deleteSound = async (soundId: string) => {
        const serverInfo = await props.voiceChangerClient!.deleteSound(soundId);
        setServerSetting(serverInfo);
        return serverInfo;
    };
    const downloadPretrained = async (model_key: string) => {
        const serverInfo = await props.voiceChangerClient!.downloadPretrained(model_key);
        setServerSetting(serverInfo);
        return serverInfo;
    };
    const deletePretrained = async (model_key: string) => {
        const serverInfo = await props.voiceChangerClient!.deletePretrained(model_key);
        setServerSetting(serverInfo);
        return serverInfo;
    };

    return {
        serverSetting,
        updateServerSettings,
        reloadServerInfo,
        uploadModel,
        uploadBackgroundSound,
        updateSoundInfo,
        deleteSound,
        uploadProgress,
        isUploading,
        getOnnx,
        mergeModel,
        updateModelDefault,
        updateModelInfo,
        uploadAssets,
        downloadPretrained,
        deletePretrained,
        deleteModel,
    };
};
