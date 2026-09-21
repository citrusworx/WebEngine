import { describe, expect, it } from "vitest";
import { signSpacesRequest } from "./sigv4.js";

describe("Spaces SigV4", () => {
    it("matches the AWS header-auth canonical request and signature", () => {
        const signed = signSpacesRequest({
            method: "GET",
            host: "examplebucket.s3.amazonaws.com",
            path: "/test.txt",
            headers: { range: "bytes=0-9" },
            accessKeyId: "AKIAIOSFODNN7EXAMPLE",
            secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
            region: "us-east-1",
            now: new Date("2013-05-24T00:00:00.000Z")
        });

        expect(signed.canonicalRequest).toBe(
            [
                "GET",
                "/test.txt",
                "",
                "host:examplebucket.s3.amazonaws.com",
                "range:bytes=0-9",
                "x-amz-content-sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "x-amz-date:20130524T000000Z",
                "",
                "host;range;x-amz-content-sha256;x-amz-date",
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            ].join("\n")
        );
        expect(signed.authorization).toBe(
            "AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41"
        );
    });

    it("builds the DigitalOcean Spaces acl canonical request", () => {
        const signed = signSpacesRequest({
            method: "GET",
            host: "static-images.nyc3.digitaloceanspaces.com",
            query: { acl: "" },
            accessKeyId: "II5JDQBAN3JYM4DNEB6C",
            secretAccessKey: "secret",
            region: "nyc3",
            now: new Date("2017-08-04T22:15:49.000Z")
        });

        expect(signed.canonicalRequest).toBe(
            [
                "GET",
                "/",
                "acl=",
                "host:static-images.nyc3.digitaloceanspaces.com",
                "x-amz-content-sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "x-amz-date:20170804T221549Z",
                "",
                "host;x-amz-content-sha256;x-amz-date",
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
            ].join("\n")
        );
        expect(signed.queryString).toBe("acl=");
    });
});
