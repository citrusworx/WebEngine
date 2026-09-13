import { beforeEach, describe, expect, it, vi } from "vitest";
import { doRequest } from "../client.js";
import {
    createPeering,
    createVPC,
    deleteVPC,
    listAllVPCs,
    listExistingVPC,
    listMemberResources,
    partialUpdateVPC,
    updateVPC
} from "./vpc.js";

vi.mock("../client.js", () => ({
    doRequest: vi.fn()
}));

const mockedRequest = vi.mocked(doRequest);

describe("vpc", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("creates, lists, gets, updates, and deletes VPCs", async () => {
        mockedRequest.mockResolvedValueOnce({
            vpc: { id: "vpc-1", name: "main", region: "nyc1", ip_range: "10.0.0.0/16", description: "", default: false, urn: "do:vpc:vpc-1", created_at: "" }
        });
        const created = await createVPC({ name: "main", region: "nyc1", ip_range: "10.0.0.0/16" });
        expect(created.id).toBe("vpc-1");

        mockedRequest.mockResolvedValueOnce({ vpcs: [created] });
        await expect(listAllVPCs()).resolves.toHaveLength(1);

        mockedRequest.mockResolvedValueOnce({ vpc: created });
        await expect(listExistingVPC("vpc-1")).resolves.toMatchObject({ id: "vpc-1" });

        mockedRequest.mockResolvedValueOnce({ vpc: { ...created, name: "renamed" } });
        await updateVPC("vpc-1", { name: "renamed" });
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "PUT",
            url: "/vpcs/vpc-1",
            data: { name: "renamed" }
        });

        mockedRequest.mockResolvedValueOnce({ vpc: created });
        await partialUpdateVPC("vpc-1", { description: "prod" });
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "PATCH",
            url: "/vpcs/vpc-1",
            data: { description: "prod" }
        });

        mockedRequest.mockResolvedValueOnce(undefined);
        await deleteVPC("vpc-1");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/vpcs/vpc-1"
        });
    });

    it("lists members and creates a peering", async () => {
        mockedRequest.mockResolvedValueOnce({ members: [{ urn: "do:droplet:1" }] });
        await expect(listMemberResources("vpc-1")).resolves.toEqual([{ urn: "do:droplet:1" }]);

        mockedRequest.mockResolvedValueOnce({
            peering: { id: "peer-1", name: "east-west", vpc_ids: ["vpc-1", "vpc-2"], created_at: "" }
        });
        const peering = await createPeering("vpc-1", { name: "east-west", vpc_id: "vpc-2" });
        expect(peering.id).toBe("peer-1");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/vpcs/vpc-1/peerings",
            data: { name: "east-west", vpc_id: "vpc-2" }
        });
    });
});
