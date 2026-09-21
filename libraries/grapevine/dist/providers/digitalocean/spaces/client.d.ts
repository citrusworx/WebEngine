export declare const SPACES_HOST_SUFFIX = "digitaloceanspaces.com";
export declare const DEFAULT_SPACES_ACCESS_KEY_ENV = "DO_SPACES_ACCESS_KEY_ID";
export declare const DEFAULT_SPACES_SECRET_KEY_ENV = "DO_SPACES_SECRET_ACCESS_KEY";
/** ListBuckets is account-wide; this is only the regional endpoint host. */
export declare const DEFAULT_SPACES_LIST_REGION = "nyc3";
export interface SpacesCredentials {
    accessKeyId: string;
    secretAccessKey: string;
}
export interface SpacesCredentialEnv {
    accessKeyEnv?: string;
    secretKeyEnv?: string;
}
export declare function spacesHost(region: string, bucket?: string): string;
export declare function getSpacesCredentials(env?: SpacesCredentialEnv): SpacesCredentials;
export declare function spacesCredentialsAreSet(env?: SpacesCredentialEnv): boolean;
export declare function xmlTag(xml: string, tag: string): string | undefined;
export declare function parseSpacesError(body: string): {
    code?: string;
    message?: string;
    requestId?: string;
};
export interface SpacesRequestOptions extends SpacesCredentialEnv {
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    region: string;
    bucket?: string;
    query?: Record<string, string | undefined>;
    headers?: Record<string, string>;
    body?: string;
    credentials?: SpacesCredentials;
}
export declare function spacesRequest(options: SpacesRequestOptions): Promise<{
    status: number;
    body: string;
}>;
