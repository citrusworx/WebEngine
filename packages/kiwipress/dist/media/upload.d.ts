import { type MediaUploadPayload } from "../types/api.js";
export type MediaUploadInit = {
    headers: Record<string, string>;
    body: BodyInit;
};
export declare function guessMediaContentType(filename: string, explicit?: string): string;
export declare function mediaUploadBasename(filename: string): string;
export declare function contentDispositionHeader(filename: string): string;
/**
 * WordPress `/wp/v2/media` create accepts either:
 * - raw binary + `Content-Type` + `Content-Disposition: attachment; filename="…"` (file-only)
 * - `multipart/form-data` with a `file` part plus metadata fields (title, alt_text, …)
 *
 * Do not set `Content-Type` for multipart — fetch must supply the boundary.
 */
export declare function createMediaUploadInit(payload: MediaUploadPayload): MediaUploadInit;
