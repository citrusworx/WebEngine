import { beforeEach, describe, expect, it, vi } from "vitest";
import { doRequest } from "../client.js";
import {
    addDropletsToFirewall,
    createFireWall,
    deleteFirewall,
    getFirewall,
    listAllFirewalls
} from "./firewall.js";

vi.mock("../client.js", () => ({
    doRequest: vi.fn()
}));

const mockedRequest = vi.mocked(doRequest);

describe("firewall", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("creates, lists, gets, and deletes firewalls", async () => {
        mockedRequest.mockResolvedValueOnce({
            firewall: { id: "fw-1", name: "web", status: "succeeded", inbound_rules: [], outbound_rules: [] }
        });
        const created = await createFireWall({
            name: "web",
            inbound_rules: [{ protocol: "tcp", ports: "443", sources: { addresses: ["0.0.0.0/0"] } }]
        });
        expect(created.id).toBe("fw-1");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/firewalls",
            data: {
                name: "web",
                inbound_rules: [{ protocol: "tcp", ports: "443", sources: { addresses: ["0.0.0.0/0"] } }]
            }
        });

        mockedRequest.mockResolvedValueOnce({ firewalls: [created] });
        await expect(listAllFirewalls()).resolves.toHaveLength(1);

        mockedRequest.mockResolvedValueOnce({ firewall: created });
        await expect(getFirewall("fw-1")).resolves.toMatchObject({ id: "fw-1" });

        mockedRequest.mockResolvedValueOnce(undefined);
        await addDropletsToFirewall("fw-1", [99]);
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/firewalls/fw-1/droplets",
            data: { droplet_ids: [99] }
        });

        mockedRequest.mockResolvedValueOnce(undefined);
        await deleteFirewall("fw-1");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/firewalls/fw-1"
        });
    });
});
