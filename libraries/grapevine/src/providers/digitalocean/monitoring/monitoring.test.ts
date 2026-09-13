import { beforeEach, describe, expect, it, vi } from "vitest";
import { doRequest } from "../client.js";
import { createAlertPolicy, deleteAlertPolicy, getAlertPolicy, listAlertPolicies } from "./monitoring.js";

vi.mock("../client.js", () => ({
    doRequest: vi.fn()
}));

const mockedRequest = vi.mocked(doRequest);

describe("monitoring", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("creates, lists, gets, and deletes alert policies", async () => {
        const policy = {
            uuid: "alert-1",
            alerts: { email: ["ops@example.com"] },
            description: "CPU",
            enabled: true,
            type: "v1/insights/droplet/cpu",
            value: 80,
            window: "5m"
        };

        mockedRequest.mockResolvedValueOnce({ policy });
        await createAlertPolicy({
            alerts: { email: ["ops@example.com"] },
            description: "CPU",
            enabled: true,
            type: "v1/insights/droplet/cpu",
            value: 80,
            window: "5m"
        });
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/monitoring/alerts",
            data: expect.objectContaining({ type: "v1/insights/droplet/cpu", value: 80 })
        });

        mockedRequest.mockResolvedValueOnce({ policies: [policy] });
        await expect(listAlertPolicies()).resolves.toHaveLength(1);

        mockedRequest.mockResolvedValueOnce({ policy });
        await expect(getAlertPolicy("alert-1")).resolves.toMatchObject({ uuid: "alert-1" });

        mockedRequest.mockResolvedValueOnce(undefined);
        await deleteAlertPolicy("alert-1");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/monitoring/alerts/alert-1"
        });
    });
});
