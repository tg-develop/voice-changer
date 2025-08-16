import { MergeModelRequest, OnnxExporterInfo, ServerInfo, ServerSettingKey } from "../const";
export declare class ServerRestClient {
    private serverUrl;
    constructor(serverUrl: string);
    getSettings: () => Promise<ServerInfo>;
    getPerformance: () => Promise<number[]>;
    updateSettings: (key: ServerSettingKey, val: string) => Promise<ServerInfo>;
    uploadFile2: (dir: string, file: File, onprogress: (progress: number, end: boolean) => void) => Promise<unknown>;
    uploadFile: (buf: ArrayBuffer, filename: string, onprogress: (progress: number, end: boolean) => void) => Promise<number>;
    concatUploadedFile: (filename: string, chunkNum: number) => Promise<void>;
    loadModel: (slot: number, isHalf: boolean, params?: string) => Promise<ServerInfo>;
    uploadAssets: (params: string) => Promise<ServerInfo>;
    getModelType: () => Promise<ServerInfo>;
    export2onnx: () => Promise<OnnxExporterInfo>;
    mergeModel: (req: MergeModelRequest) => Promise<ServerInfo>;
    updateModelDefault: () => Promise<ServerInfo>;
    updateModelInfo: (slot: number, key: string, val: string) => Promise<ServerInfo>;
    postVoice: (timestamp: number, buffer: ArrayBuffer) => Promise<any>;
}
