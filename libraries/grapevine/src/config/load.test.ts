import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { isRemoteConfigSource, loadGrapeConfig, parseConfigText } from "./load.js";

vi.mock("axios", () => ({
    default: {
        get: vi.fn()
    }
}));

describe("load grape config", () => {
    afterEach(() => {
        vi.mocked(axios.get).mockReset();
    });

    it("parses YAML and JSON text", () => {
        const yaml = parseConfigText("provider: digitalocean\nregion: nyc1\n");
        expect(yaml).toMatchObject({ provider: "digitalocean" });
        const json = parseConfigText('{"provider":"digitalocean","region":"sfo3"}', "file.json");
        expect(json).toMatchObject({ region: "sfo3" });
    });

    it("detects remote sources", () => {
        expect(isRemoteConfigSource("https://example.com/grape.yaml")).toBe(true);
        expect(isRemoteConfigSource("./grape.yaml")).toBe(false);
    });

    it("loads a local file", async () => {
        const dir = await mkdtemp(path.join(tmpdir(), "grape-"));
        const file = path.join(dir, "grape.json");
        await writeFile(file, JSON.stringify({ provider: "digitalocean", region: "nyc1" }), "utf8");
        const config = await loadGrapeConfig(file);
        expect(config.provider).toBe("digitalocean");
    });

    it("loads a remote YAML URL", async () => {
        vi.mocked(axios.get).mockResolvedValue({
            data: "provider: digitalocean\nregion: fra1\n"
        });
        const config = await loadGrapeConfig("https://example.com/grape.config.yaml");
        expect(config.region).toBe("fra1");
        expect(axios.get).toHaveBeenCalledWith(
            "https://example.com/grape.config.yaml",
            expect.objectContaining({ responseType: "text" })
        );
    });
});
