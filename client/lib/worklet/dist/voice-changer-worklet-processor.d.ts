export declare const RequestType: {
    readonly voice: "voice";
    readonly config: "config";
    readonly start: "start";
    readonly stop: "stop";
    readonly trancateBuffer: "trancateBuffer";
};
export type RequestType = (typeof RequestType)[keyof typeof RequestType];
export declare const ResponseType: {
    readonly inputData: "inputData";
    readonly start_ok: "start_ok";
    readonly stop_ok: "stop_ok";
};
export type ResponseType = (typeof ResponseType)[keyof typeof ResponseType];
export type VoiceChangerWorkletProcessorRequest = {
    requestType: RequestType;
    voice: Float32Array;
};
export type VoiceChangerWorkletProcessorResponse = {
    responseType: ResponseType;
    recordData?: Float32Array[];
    inputData?: Float32Array;
};
