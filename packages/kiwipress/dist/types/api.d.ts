export type ApiDefinition = {
    method: string;
    endpoint: string;
};
export type WordPressPayload = Record<string, unknown>;
export type MediaFileBytes = Blob | ArrayBuffer | ArrayBufferView;
export type MediaUploadPayload = WordPressPayload & {
    file: MediaFileBytes;
    filename: string;
    contentType?: string;
};
export declare function isMediaFileBytes(value: unknown): value is MediaFileBytes;
export declare function isMediaUploadPayload(value: unknown): value is MediaUploadPayload;
export declare function mediaUploadFields(payload: MediaUploadPayload): Record<string, unknown>;
