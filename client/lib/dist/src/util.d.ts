export declare const createDummyMediaStream: (audioContext: AudioContext) => MediaStream;
export declare const fileSelector: (regex: string) => Promise<File>;
export declare const fileSelectorAsDataURL: (regex: string) => Promise<string>;
export declare const validateUrl: (url: string) => string;
