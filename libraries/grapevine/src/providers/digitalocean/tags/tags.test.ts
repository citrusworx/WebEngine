import { beforeEach, describe, expect, it, vi } from "vitest";
import { doRequest } from "../client.js";
import { createTag, deleteTag, listAllTags, listTag, tagResource, untagResource } from "./tags.js";

vi.mock("../client.js", () => ({
    doRequest: vi.fn()
}));

const mockedRequest = vi.mocked(doRequest);

describe("tags", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("lists and gets tags", async () => {
        mockedRequest.mockResolvedValueOnce({ tags: [{ name: "prod" }] });
        await expect(listAllTags()).resolves.toEqual([{ name: "prod" }]);

        mockedRequest.mockResolvedValueOnce({ tag: { name: "prod" } });
        await expect(listTag("prod")).resolves.toEqual({ name: "prod" });
        expect(mockedRequest).toHaveBeenLastCalledWith({
            method: "GET",
            url: "/tags/prod"
        });
    });

    it("creates, assigns, unassigns, and deletes tags", async () => {
        mockedRequest.mockResolvedValueOnce({ tag: { name: "web" } });
        await createTag("web");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/tags",
            data: { name: "web" }
        });

        const resources = [{ resource_id: "123", resource_type: "droplet" }];
        mockedRequest.mockResolvedValue(undefined);
        await tagResource("web", resources);
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/tags/web/resources",
            data: { resources }
        });

        await untagResource("web", resources);
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/tags/web/resources",
            data: { resources }
        });

        await deleteTag("web");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/tags/web"
        });
    });
});
