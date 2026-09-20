import { afterEach, describe, expect, it, vi } from "vitest";
import { Media } from "./media.js";
import { contentDispositionHeader, createMediaUploadInit } from "./upload.js";

const wordpressConfig = {
    url: "http://example.com",
    apiBase: "wp-json/wp/v2"
};

function stubWordPress(body: unknown = { id: 8 }) {
    const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => body
    }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

describe("Media domain", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("uploads a file-only payload as raw bytes with Content-Disposition", async () => {
        const fetchMock = stubWordPress();
        const bytes = new Uint8Array([1, 2, 3, 4]);
        const media = new Media(wordpressConfig);

        await expect(media.create({
            file: bytes,
            filename: "hero.png"
        })).resolves.toEqual({ id: 8 });

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/media");
        const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
        expect(init.method).toBe("POST");
        expect(init.body).toBeInstanceOf(Blob);
        expect(init.headers).toMatchObject({
            "Content-Type": "image/png",
            "Content-Disposition": 'attachment; filename="hero.png"'
        });
        expect(JSON.stringify(init.headers)).not.toContain("application/json");
    });

    it("uploads file plus metadata as multipart/form-data", async () => {
        const fetchMock = stubWordPress();
        const media = new Media(wordpressConfig);

        await expect(media.create({
            file: new Uint8Array([9, 8, 7]),
            filename: "alt.jpg",
            title: "Hero",
            alt_text: "A hero image"
        })).resolves.toEqual({ id: 8 });

        const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
        expect(init.method).toBe("POST");
        expect(init.body).toBeInstanceOf(FormData);
        const form = init.body as FormData;
        expect(form.get("title")).toBe("Hero");
        expect(form.get("alt_text")).toBe("A hero image");
        expect(form.get("file")).toBeInstanceOf(Blob);
        expect(init.headers).not.toMatchObject({
            "Content-Type": "application/json"
        });
        expect((init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
    });
});

describe("media upload helpers", () => {
    it("quotes Content-Disposition filenames", () => {
        expect(contentDispositionHeader("path/to/quote\"me.png")).toBe(
            'attachment; filename="quote\\"me.png"'
        );
    });

    it("uses multipart when metadata fields are present", () => {
        const upload = createMediaUploadInit({
            file: new Uint8Array([1]),
            filename: "a.webp",
            caption: "Wide shot"
        });

        expect(upload.body).toBeInstanceOf(FormData);
        expect(upload.headers["Content-Type"]).toBeUndefined();
    });
});
