import { beforeEach, describe, expect, it, vi } from "vitest";
import { doRequest } from "../client.js";
import {
    createDomain,
    createDomainRecord,
    deleteDomain,
    deleteDomainRecord,
    listAllDomainRecords,
    listAllDomains,
    listExistingDomain
} from "./domains.js";

vi.mock("../client.js", () => ({
    doRequest: vi.fn()
}));

const mockedRequest = vi.mocked(doRequest);

describe("domains", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("lists domains", async () => {
        mockedRequest.mockResolvedValue({ domains: [{ name: "example.com", ttl: 1800 }] });
        await expect(listAllDomains()).resolves.toEqual([{ name: "example.com", ttl: 1800 }]);
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "GET",
            url: "/domains",
            params: {}
        });
    });

    it("gets, creates, and deletes a domain", async () => {
        mockedRequest.mockResolvedValueOnce({ domain: { name: "example.com" } });
        await expect(listExistingDomain("example.com")).resolves.toEqual({ name: "example.com" });

        mockedRequest.mockResolvedValueOnce({ domain: { name: "app.dev" } });
        await createDomain({ name: "app.dev", ip_address: "203.0.113.10" });
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/domains",
            data: { name: "app.dev", ip_address: "203.0.113.10" }
        });

        mockedRequest.mockResolvedValueOnce(undefined);
        await deleteDomain("app.dev");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/domains/app.dev"
        });
    });

    it("manages DNS records", async () => {
        mockedRequest.mockResolvedValueOnce({
            domain_records: [{ id: 1, type: "A", name: "www", data: "203.0.113.10" }]
        });
        const records = await listAllDomainRecords("example.com", { type: "A" });
        expect(records[0]?.type).toBe("A");

        mockedRequest.mockResolvedValueOnce({
            domain_record: { id: 2, type: "CNAME", name: "www", data: "example.com." }
        });
        await createDomainRecord("example.com", { type: "CNAME", name: "www", data: "example.com." });
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/domains/example.com/records",
            data: { type: "CNAME", name: "www", data: "example.com." }
        });

        mockedRequest.mockResolvedValueOnce(undefined);
        await deleteDomainRecord("example.com", 2);
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/domains/example.com/records/2"
        });
    });
});
