import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DigitalOceanError } from "../client.js";
import { spacesRequest } from "./client.js";
import { createSpace, deleteSpace, listSpaces, parseListBuckets } from "./spaces.js";

vi.mock("axios", () => {
    const request = vi.fn();
    const isAxiosError = (error: unknown) => Boolean(error && typeof error === "object" && "isAxiosError" in error);
    return {
        default: { request, isAxiosError },
        isAxiosError
    };
});

const mockedAxios = vi.mocked(axios);

const credentials = {
    accessKeyId: "spaces-key",
    secretAccessKey: "spaces-secret"
};

describe("digitalocean spaces", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.DO_SPACES_ACCESS_KEY_ID;
        delete process.env.DO_SPACES_SECRET_ACCESS_KEY;
    });

    it("parses ListBuckets XML", () => {
        const buckets = parseListBuckets(`<?xml version="1.0" encoding="UTF-8"?>
<ListAllMyBucketsResult>
  <Buckets>
    <Bucket>
      <Name>juice-static</Name>
      <CreationDate>2023-05-01T12:00:00.000Z</CreationDate>
    </Bucket>
  </Buckets>
</ListAllMyBucketsResult>`);
        expect(buckets).toEqual([{ name: "juice-static", creation_date: "2023-05-01T12:00:00.000Z" }]);
    });

    it("lists buckets with a signed GET against the regional endpoint", async () => {
        mockedAxios.request.mockResolvedValue({ status: 200, data: "<ListAllMyBucketsResult><Buckets></Buckets></ListAllMyBucketsResult>" });
        await expect(listSpaces("nyc3", { credentials })).resolves.toEqual([]);
        expect(mockedAxios.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "GET",
                url: "https://nyc3.digitaloceanspaces.com/",
                headers: expect.objectContaining({
                    Authorization: expect.stringMatching(/^AWS4-HMAC-SHA256 Credential=spaces-key\//),
                    "x-amz-content-sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                })
            })
        );
    });

    it("creates a bucket with x-amz-acl on the bucket host", async () => {
        mockedAxios.request.mockResolvedValue({ status: 200, data: "" });
        const created = await createSpace(
            { name: "juice-static", region: "nyc3", acl: "public-read" },
            { credentials }
        );
        expect(created).toEqual({
            name: "juice-static",
            region: "nyc3",
            origin: "juice-static.nyc3.digitaloceanspaces.com",
            acl: "public-read"
        });
        expect(mockedAxios.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "PUT",
                url: "https://juice-static.nyc3.digitaloceanspaces.com/",
                headers: expect.objectContaining({
                    "x-amz-acl": "public-read",
                    Authorization: expect.stringContaining("SignedHeaders=host;x-amz-acl;x-amz-content-sha256;x-amz-date")
                })
            })
        );
    });

    it("deletes a bucket and surfaces BucketNotEmpty", async () => {
        mockedAxios.request.mockResolvedValueOnce({ status: 204, data: "" });
        await deleteSpace("juice-static", "nyc3", { credentials });
        expect(mockedAxios.request).toHaveBeenCalledWith(
            expect.objectContaining({
                method: "DELETE",
                url: "https://juice-static.nyc3.digitaloceanspaces.com/"
            })
        );

        mockedAxios.request.mockResolvedValueOnce({
            status: 409,
            data: "<Error><Code>BucketNotEmpty</Code><Message>The bucket you tried to delete is not empty.</Message><RequestId>req-9</RequestId></Error>"
        });
        const error = await deleteSpace("juice-static", "nyc3", { credentials }).catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(DigitalOceanError);
        expect(error).toMatchObject({
            message: "The bucket you tried to delete is not empty.",
            status: 409,
            id: "BucketNotEmpty",
            requestId: "req-9"
        });
    });

    it("refuses to call Spaces without access keys", async () => {
        await expect(spacesRequest({ method: "GET", region: "nyc3" })).rejects.toThrow(/DO_SPACES_ACCESS_KEY_ID/);
        expect(mockedAxios.request).not.toHaveBeenCalled();
    });
});
