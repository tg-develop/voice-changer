import { MergeModelRequest, ServerSettingKey } from "../const";
export declare class ServerConfigurator {
    private restClient;
    constructor(serverUrl: string);
    getSettings: () => Promise<import("../const").ServerInfo>;
    getPerformance: () => Promise<number[]>;
    updateSettings: (key: ServerSettingKey, val: string) => Promise<import("../const").ServerInfo>;
    uploadFile2: (dir: string, file: File, onprogress: (progress: number, end: boolean) => void) => Promise<unknown>;
    uploadFile: (buf: ArrayBuffer, filename: string, onprogress: (progress: number, end: boolean) => void) => Promise<number>;
    concatUploadedFile: (filename: string, chunkNum: number) => Promise<void>;
    loadModel: (slot: number, isHalf: boolean, params?: string) => Promise<import("../const").ServerInfo>;
    deleteModel: (slot: number) => Promise<import("../const").ServerInfo>;
    uploadAssets: (params: string) => Promise<import("../const").ServerInfo>;
    loadSound: (params?: string) => Promise<import("../const").ServerInfo>;
    updateSoundInfo: (slot: string, key: string, val: string) => Promise<import("../const").ServerInfo>;
    deleteSound: (slot: string) => Promise<import("../const").ServerInfo>;
    getModelType: () => Promise<import("../const").ServerInfo>;
    export2onnx: () => Promise<import("../const").OnnxExporterInfo>;
    mergeModel: (req: MergeModelRequest) => Promise<import("../const").ServerInfo>;
    updateModelDefault: () => Promise<import("../const").ServerInfo>;
    updateModelInfo: (slot: number, key: string, val: string) => Promise<import("../const").ServerInfo>;
    downloadPretrained: (model_key: string) => Promise<import("../const").ServerInfo>;
    deletePretrained: (model_key: string) => Promise<import("../const").ServerInfo>;
}
