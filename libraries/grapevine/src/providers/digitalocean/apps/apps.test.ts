import { beforeEach, describe, expect, it, vi } from "vitest";
import { doRequest } from "../client.js";
import { createApp, deleteApp, getApp, listApps, listDeployments } from "./apps.js";

vi.mock("../client.js", () => ({
    doRequest: vi.fn()
}));

const mockedRequest = vi.mocked(doRequest);

describe("apps", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("covers App Platform CRUD", async () => {
        const app = { id: "app-1", spec: { name: "api" } };
        mockedRequest.mockResolvedValueOnce({ apps: [app] });
        await expect(listApps()).resolves.toEqual([app]);

        mockedRequest.mockResolvedValueOnce({ app });
        await expect(getApp("app-1")).resolves.toEqual(app);

        mockedRequest.mockResolvedValueOnce({ app });
        await createApp({ spec: { name: "api", region: "nyc" } });
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/apps",
            data: { spec: { name: "api", region: "nyc" } }
        });

        mockedRequest.mockResolvedValueOnce({ deployments: [{ id: "d1" }] });
        await expect(listDeployments("app-1")).resolves.toEqual([{ id: "d1" }]);

        mockedRequest.mockResolvedValueOnce(undefined);
        await deleteApp("app-1");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/apps/app-1"
        });
    });
});
