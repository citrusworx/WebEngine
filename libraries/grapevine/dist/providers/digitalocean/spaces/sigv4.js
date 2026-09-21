import { createHash, createHmac } from "node:crypto";
/** SHA256 of an empty payload. Required on SigV4 requests with no body. */
export const EMPTY_PAYLOAD_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
function encodeRfc3986(value) {
    return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}
export function canonicalUri(path = "/") {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return normalized
        .split("/")
        .map((segment) => encodeRfc3986(segment))
        .join("/");
}
export function canonicalQueryString(query = {}) {
    return Object.entries(query)
        .filter((entry) => entry[1] !== undefined)
        .map(([key, value]) => [encodeRfc3986(key), encodeRfc3986(value)])
        .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0))
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
}
function sha256Hex(value) {
    return createHash("sha256").update(value, "utf8").digest("hex");
}
function hmac(key, value) {
    return createHmac("sha256", key).update(value, "utf8").digest();
}
function amzTimestamps(now) {
    const stamp = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    return { amzDate: stamp, dateStamp: stamp.slice(0, 8) };
}
/**
 * AWS Signature Version 4 for the DigitalOcean Spaces (S3-compatible) API.
 * Service is always `s3`. The region slug is the Spaces region (`nyc3`, …).
 */
export function signSpacesRequest(input) {
    const { amzDate, dateStamp } = amzTimestamps(input.now ?? new Date());
    const payloadHash = input.body !== undefined ? sha256Hex(input.body) : EMPTY_PAYLOAD_SHA256;
    const unsigned = new Map();
    unsigned.set("host", input.host.trim());
    unsigned.set("x-amz-content-sha256", payloadHash);
    unsigned.set("x-amz-date", amzDate);
    for (const [name, value] of Object.entries(input.headers ?? {})) {
        unsigned.set(name.toLowerCase(), value.trim().replace(/\s+/g, " "));
    }
    const signedHeaderNames = [...unsigned.keys()].sort();
    const canonicalHeaders = signedHeaderNames.map((name) => `${name}:${unsigned.get(name)}\n`).join("");
    const signedHeaders = signedHeaderNames.join(";");
    const queryString = canonicalQueryString(input.query);
    const canonicalRequest = [
        input.method.toUpperCase(),
        canonicalUri(input.path),
        queryString,
        canonicalHeaders,
        signedHeaders,
        payloadHash
    ].join("\n");
    const credentialScope = `${dateStamp}/${input.region}/s3/aws4_request`;
    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
    const dateKey = hmac(`AWS4${input.secretAccessKey}`, dateStamp);
    const dateRegionKey = hmac(dateKey, input.region);
    const dateRegionServiceKey = hmac(dateRegionKey, "s3");
    const signingKey = hmac(dateRegionServiceKey, "aws4_request");
    const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");
    const authorization = `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    const headers = { Authorization: authorization };
    for (const name of signedHeaderNames) {
        headers[name] = unsigned.get(name) ?? "";
    }
    return { authorization, headers, canonicalRequest, queryString };
}
//# sourceMappingURL=sigv4.js.map