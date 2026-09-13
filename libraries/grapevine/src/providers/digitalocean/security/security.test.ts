import { beforeEach, describe, expect, it, vi } from "vitest";
import { doRequest } from "../client.js";
import {
    createScan,
    createSuppression,
    deleteSuppression,
    getLatestScans,
    getScan,
    listAffectedResources,
    listScans,
    listSettings,
    updatePlan
} from "./security.js";

vi.mock("../client.js", () => ({
    doRequest: vi.fn()
}));

const mockedRequest = vi.mocked(doRequest);

describe("security", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("lists and fetches scans", async () => {
        mockedRequest.mockResolvedValueOnce({ scans: [{ id: "scan-1", status: "COMPLETED" }] });
        await expect(listScans()).resolves.toEqual([{ id: "scan-1", status: "COMPLETED" }]);
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/security/scans",
            params: {}
        });

        mockedRequest.mockResolvedValueOnce({ scan: { id: "scan-1", status: "COMPLETED" } });
        await expect(getScan("scan-1")).resolves.toMatchObject({ id: "scan-1" });

        mockedRequest.mockResolvedValueOnce({ scan: { id: "latest", status: "IN_PROGRESS" } });
        await expect(getLatestScans()).resolves.toMatchObject({ id: "latest" });
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/security/scans/latest"
        });
    });

    it("creates scans, suppressions, and plan updates", async () => {
        mockedRequest.mockResolvedValueOnce({ scan: { id: "scan-2", status: "IN_PROGRESS" } });
        await createScan();
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/security/scans"
        });

        mockedRequest.mockResolvedValueOnce({ settings: {} });
        await listSettings();
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/security/settings",
            params: {}
        });

        mockedRequest.mockResolvedValueOnce({ resources: [{ urn: "do:droplet:1" }] });
        await listAffectedResources("scan-1", "finding-1");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/security/scans/scan-1/findings/finding-1/affected_resources",
            params: {}
        });

        mockedRequest.mockResolvedValueOnce({ resources: [] });
        await createSuppression({
            rule_uuid: "rule-1",
            resources: ["do:droplet:1"]
        });
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/security/settings/suppressions",
            data: { rule_uuid: "rule-1", resources: ["do:droplet:1"] }
        });

        mockedRequest.mockResolvedValueOnce({ tier_coverage: { basic: { tags: ["prod"] } } });
        await updatePlan({ tier_coverage: { basic: { tags: ["prod"] } } });

        mockedRequest.mockResolvedValueOnce(undefined);
        await deleteSuppression("sup-1");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/security/settings/suppressions/sup-1"
        });
    });
});
