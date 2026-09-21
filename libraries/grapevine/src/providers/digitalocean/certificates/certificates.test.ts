import { beforeEach, describe, expect, it, vi } from "vitest";
import { doRequest } from "../client.js";
import {
    createCertificate,
    deleteCertificate,
    getCertificate,
    listCertificates,
    waitForCertificate
} from "./certificates.js";

vi.mock("../client.js", () => ({
    doRequest: vi.fn()
}));

const mockedRequest = vi.mocked(doRequest);

describe("digitalocean certificates", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("creates Let's Encrypt and custom certificates", async () => {
        const letsEncrypt = {
            id: "cert-1",
            name: "juice-static",
            type: "lets_encrypt",
            state: "pending",
            dns_names: ["static.example.com"]
        };
        mockedRequest.mockResolvedValueOnce({ certificates: [letsEncrypt] });
        await expect(listCertificates()).resolves.toEqual([letsEncrypt]);

        mockedRequest.mockResolvedValueOnce({ certificate: letsEncrypt });
        await createCertificate({
            name: "juice-static",
            type: "lets_encrypt",
            dns_names: ["static.example.com"]
        });
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "POST",
            url: "/certificates",
            data: {
                name: "juice-static",
                type: "lets_encrypt",
                dns_names: ["static.example.com"]
            }
        });

        mockedRequest.mockResolvedValueOnce({
            certificate: { id: "cert-2", name: "custom", type: "custom", state: "verified" }
        });
        await createCertificate({
            name: "custom",
            type: "custom",
            private_key: "KEY",
            leaf_certificate: "CERT",
            certificate_chain: "CHAIN"
        });
        expect(mockedRequest).toHaveBeenLastCalledWith({
            method: "POST",
            url: "/certificates",
            data: {
                name: "custom",
                type: "custom",
                private_key: "KEY",
                leaf_certificate: "CERT",
                certificate_chain: "CHAIN"
            }
        });

        mockedRequest.mockResolvedValueOnce(undefined);
        await deleteCertificate("cert-1");
        expect(mockedRequest).toHaveBeenCalledWith({
            method: "DELETE",
            url: "/certificates/cert-1"
        });
    });

    it("waits until a Let's Encrypt certificate is verified", async () => {
        mockedRequest
            .mockResolvedValueOnce({
                certificate: { id: "cert-1", name: "juice-static", state: "pending", type: "lets_encrypt" }
            })
            .mockResolvedValueOnce({
                certificate: { id: "cert-1", name: "juice-static", state: "verified", type: "lets_encrypt" }
            });
        const sleeps: number[] = [];
        const ready = await waitForCertificate("cert-1", {
            intervalMs: 5,
            sleep: async (ms) => {
                sleeps.push(ms);
            }
        });
        expect(ready.state).toBe("verified");
        expect(sleeps).toEqual([5]);
        expect(getCertificate).toBeTypeOf("function");
    });

    it("stops when the certificate stays pending past the timeout", async () => {
        mockedRequest.mockResolvedValue({
            certificate: { id: "cert-1", name: "juice-static", state: "pending", type: "lets_encrypt" }
        });
        await expect(
            waitForCertificate("cert-1", { timeoutMs: 0, intervalMs: 5, sleep: async () => undefined })
        ).rejects.toThrow(/Timed out waiting/);
        expect(mockedRequest).toHaveBeenCalledTimes(1);
    });

    it("fails fast when issuance enters error", async () => {
        mockedRequest.mockResolvedValueOnce({
            certificate: { id: "cert-1", name: "juice-static", state: "error", type: "lets_encrypt" }
        });
        await expect(waitForCertificate("cert-1", { sleep: async () => undefined })).rejects.toThrow(/state "error"/);
    });
});
