import { beforeEach, describe, expect, it, vi } from "vitest";
import { doRequest } from "../client.js";
import {
    createDroplet,
    deleteDroplet,
    getDroplet,
    getDropletStatus,
    listAllDroplets
} from "./droplet.js";

vi.mock("../client.js", () => ({
    doRequest: vi.fn()
}));

const mockedRequest = vi.mocked(doRequest);

describe("Droplet", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DO_TOKEN = "fake-token";
    });

    describe("getDropletStatus", () => {
        it("returns the droplet status", async () => {
            mockedRequest.mockResolvedValue({
                droplet: { id: 123, status: "active", name: "web", memory: 1024, image: {}, size: {} }
            });

            await expect(getDropletStatus(123)).resolves.toBe("active");
            expect(mockedRequest).toHaveBeenCalledWith({
                method: "GET",
                url: "/droplets/123"
            });
        });

        it("throws on API failure", async () => {
            mockedRequest.mockRejectedValue(new Error("API Error"));
            await expect(getDropletStatus(123)).rejects.toThrow("API Error");
        });
    });

    it("lists droplets", async () => {
        mockedRequest.mockResolvedValue({
            droplets: [{ id: 1, status: "active", name: "web", memory: 1024, image: {}, size: {} }]
        });

        const droplets = await listAllDroplets({ tag_name: "web" });
        expect(droplets).toHaveLength(1);
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/droplets",
            params: { tag_name: "web" }
        });
    });

    it("gets a droplet", async () => {
        mockedRequest.mockResolvedValue({
            droplet: { id: 9, status: "new", name: "db", memory: 2048, image: {}, size: {} }
        });
        const droplet = await getDroplet(9);
        expect(droplet.id).toBe(9);
    });

    it("creates a droplet from a DropletBlueprint", async () => {
        mockedRequest.mockResolvedValue({
            droplet: { id: 42, status: "new", name: "web-01", memory: 1024, image: {}, size: {} },
            links: { actions: [] }
        });

        const created = await createDroplet({
            name: "web-01",
            region: "nyc1",
            size: "s-1vcpu-1gb",
            image: "ubuntu-24-04-x64"
        });

        expect(created.id).toBe(42);
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/droplets",
            data: {
                name: "web-01",
                region: "nyc1",
                size: "s-1vcpu-1gb",
                image: "ubuntu-24-04-x64"
            }
        });
    });

    it("creates a droplet from a blueprint document", async () => {
        mockedRequest.mockResolvedValue({
            droplet: { id: 43, status: "new", name: "web-01", memory: 1024, image: {}, size: {} },
            links: { actions: [] }
        });

        await createDroplet({
            blueprint: {
                name: "create-single-droplet",
                droplet: {
                    name: "web-01",
                    region: "nyc3",
                    size: "s-1vcpu-1gb",
                    image: "ubuntu-24-04-x64"
                }
            }
        });

        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/droplets",
            data: {
                name: "web-01",
                region: "nyc3",
                size: "s-1vcpu-1gb",
                image: "ubuntu-24-04-x64"
            }
        });
    });

    it("deletes a droplet", async () => {
        mockedRequest.mockResolvedValue({});
        await deleteDroplet(42);
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/droplets/42"
        });
    });
});
