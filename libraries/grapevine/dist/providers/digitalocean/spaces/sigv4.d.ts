/** SHA256 of an empty payload. Required on SigV4 requests with no body. */
export declare const EMPTY_PAYLOAD_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
export interface SpacesSignatureInput {
    method: string;
    host: string;
    path?: string;
    query?: Record<string, string | undefined>;
    headers?: Record<string, string>;
    /** UTF-8 string or raw object bytes. Omitted means an empty payload hash. */
    body?: string | Uint8Array;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    now?: Date;
}
export interface SpacesSignature {
    authorization: string;
    headers: Record<string, string>;
    canonicalRequest: string;
    queryString: string;
}
export declare function canonicalUri(path?: string): string;
export declare function canonicalQueryString(query?: Record<string, string | undefined>): string;
/**
 * AWS Signature Version 4 for the DigitalOcean Spaces (S3-compatible) API.
 * Service is always `s3`. The region slug is the Spaces region (`nyc3`, …).
 */
export declare function signSpacesRequest(input: SpacesSignatureInput): SpacesSignature;
