import axios from "axios";
import { DigitalOceanError, wrapDoError } from "../client.js";
import { signSpacesRequest } from "./sigv4.js";

export const SPACES_HOST_SUFFIX = "digitaloceanspaces.com";
export const DEFAULT_SPACES_ACCESS_KEY_ENV = "DO_SPACES_ACCESS_KEY_ID";
export const DEFAULT_SPACES_SECRET_KEY_ENV = "DO_SPACES_SECRET_ACCESS_KEY";
/** ListBuckets is account-wide; this is only the regional endpoint host. */
export const DEFAULT_SPACES_LIST_REGION = "nyc3";

export interface SpacesCredentials {
    accessKeyId: string;
    secretAccessKey: string;
}

export interface SpacesCredentialEnv {
    accessKeyEnv?: string;
    secretKeyEnv?: string;
}

export function spacesHost(region: string, bucket?: string): string {
    const regionHost = `${region}.${SPACES_HOST_SUFFIX}`;
    return bucket ? `${bucket}.${regionHost}` : regionHost;
}

export function getSpacesCredentials(env: SpacesCredentialEnv = {}): SpacesCredentials {
    const accessKeyEnv = env.accessKeyEnv ?? DEFAULT_SPACES_ACCESS_KEY_ENV;
    const secretKeyEnv = env.secretKeyEnv ?? DEFAULT_SPACES_SECRET_KEY_ENV;
    const accessKeyId = process.env[accessKeyEnv]?.trim();
    const secretAccessKey = process.env[secretKeyEnv]?.trim();
    if (!accessKeyId || !secretAccessKey) {
        throw new DigitalOceanError(
            `Spaces credentials are not set. Export ${accessKeyEnv} and ${secretKeyEnv} (a Spaces key with All permissions for bucket create, list, and delete). CDN endpoints and certificates use the DigitalOcean API token and do not need Spaces keys.`
        );
    }
    return { accessKeyId, secretAccessKey };
}

export function spacesCredentialsAreSet(env: SpacesCredentialEnv = {}): boolean {
    try {
        getSpacesCredentials(env);
        return true;
    } catch {
        return false;
    }
}

export function xmlTag(xml: string, tag: string): string | undefined {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return match?.[1];
}

export function parseSpacesError(body: string): { code?: string; message?: string; requestId?: string } {
    return {
        code: xmlTag(body, "Code"),
        message: xmlTag(body, "Message"),
        requestId: xmlTag(body, "RequestId")
    };
}

export interface SpacesRequestOptions extends SpacesCredentialEnv {
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    region: string;
    bucket?: string;
    query?: Record<string, string | undefined>;
    headers?: Record<string, string>;
    body?: string;
    credentials?: SpacesCredentials;
}

export async function spacesRequest(options: SpacesRequestOptions): Promise<{ status: number; body: string }> {
    const credentials =
        options.credentials ??
        getSpacesCredentials({
            accessKeyEnv: options.accessKeyEnv,
            secretKeyEnv: options.secretKeyEnv
        });
    const host = spacesHost(options.region, options.bucket);
    const signed = signSpacesRequest({
        method: options.method,
        host,
        path: "/",
        query: options.query,
        headers: options.headers,
        body: options.body,
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: options.region
    });
    const query = signed.queryString ? `?${signed.queryString}` : "";
    const url = `https://${host}/${query}`;

    try {
        const response = await axios.request<string>({
            method: options.method,
            url,
            data: options.body,
            responseType: "text",
            transformResponse: [(data) => data],
            headers: signed.headers,
            validateStatus: () => true
        });
        const body = typeof response.data === "string" ? response.data : String(response.data ?? "");
        if (response.status >= 200 && response.status < 300) {
            return { status: response.status, body };
        }
        const parsed = parseSpacesError(body);
        throw new DigitalOceanError(parsed.message ?? `Spaces API request failed (${response.status})`, {
            status: response.status,
            id: parsed.code,
            requestId: parsed.requestId,
            details: body
        });
    } catch (error) {
        throw wrapDoError(error);
    }
}
