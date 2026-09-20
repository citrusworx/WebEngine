import { afterEach, describe, expect, it, vi } from "vitest";
import { Media } from "./media.js";
import {
    createMedia,
    deleteMedia,
    getAllMedia,
    getMediaById,
    updateMedia
} from "./routes.js";

const wordpressConfig = {
    url: "http://example.com",
    apiBase: "wp-json/wp/v2"
};

describe("media routes", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("exposes WordPress media read and write routes with PUT updates", () => {
        expect(getAllMedia.method).toBe("GET");
        expect(getAllMedia.path).toBe("/media");
        expect(getMediaById.method).toBe("GET");
        expect(getMediaById.path).toBe("/media/:id");
        expect(createMedia.method).toBe("POST");
        expect(createMedia.path).toBe("/media");
        expect(updateMedia.method).toBe("PUT");
        expect(updateMedia.path).toBe("/media/:id");
        expect(deleteMedia.method).toBe("DELETE");
        expect(deleteMedia.path).toBe("/media/:id");
    });

    it("reads the media collection and a single item", async () => {
        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => [{ id: 9 }]
        }));
        vi.stubGlobal("fetch", fetchMock);

        const media = new Media(wordpressConfig);
        await expect(media.getAll()).resolves.toEqual([{ id: 9 }]);
        await expect(media.getById(9)).resolves.toEqual([{ id: 9 }]);

        expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://example.com/wp-json/wp/v2/media");
        expect(String(fetchMock.mock.calls[1]?.[0])).toBe("http://example.com/wp-json/wp/v2/media/9");
    });
});
