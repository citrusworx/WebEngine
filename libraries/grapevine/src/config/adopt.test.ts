import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import sshpk from "sshpk";
import {
    adoptDroplet,
    adoptFirewall,
    adoptSSHKey,
    adoptVPC,
    formatAmbiguousError,
    sshKeyMatchesPublicKey
} from "./adopt.js";

function sshKeyPair() {
    const { publicKey } = generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
    });
    return sshpk.parseKey(publicKey, "pem").toString("ssh");
}

describe("adopt helpers", () => {
    it("adopts a unique SSH key by name", () => {
        const adopted = adoptSSHKey(
            [
                { id: 1, name: "other", fingerprint: "aa", public_key: "ssh-ed25519 A" },
                { id: 7, name: "kiwipress", fingerprint: "bb", public_key: "ssh-ed25519 B" }
            ],
            "kiwipress"
        );
        expect(adopted?.id).toBe(7);
    });

    it("prefers a unique fingerprint match when a public key is supplied", () => {
        const publicKey = sshKeyPair();
        const adopted = adoptSSHKey(
            [
                { id: 1, name: "kiwipress", fingerprint: "00:11", public_key: "ssh-ed25519 OTHER" },
                { id: 9, name: "leftover", fingerprint: "ff:ee", public_key: publicKey }
            ],
            "kiwipress",
            publicKey
        );
        expect(adopted?.id).toBe(9);
        expect(sshKeyMatchesPublicKey({ id: 9, name: "leftover", fingerprint: "ff:ee", public_key: publicKey }, publicKey)).toBe(
            true
        );
    });

    it("fails when the SSH key name is ambiguous", () => {
        expect(() =>
            adoptSSHKey(
                [
                    { id: 11, name: "kiwipress", fingerprint: "aa", public_key: "ssh-ed25519 A" },
                    { id: 22, name: "kiwipress", fingerprint: "bb", public_key: "ssh-ed25519 B" }
                ],
                "kiwipress"
            )
        ).toThrow(formatAmbiguousError("SSH key", "kiwipress", [{ id: 11 }, { id: 22 }]));
    });

    it("adopts a unique VPC in the target region", () => {
        const adopted = adoptVPC(
            [
                {
                    id: "vpc-1",
                    name: "kiwipress",
                    description: "",
                    region: "nyc3",
                    ip_range: "10.80.0.0/16",
                    default: false,
                    urn: "do:vpc:vpc-1",
                    created_at: ""
                }
            ],
            "kiwipress",
            "nyc3"
        );
        expect(adopted?.id).toBe("vpc-1");
    });

    it("fails when a VPC name exists only in another region", () => {
        expect(() =>
            adoptVPC(
                [
                    {
                        id: "vpc-sfo",
                        name: "kiwipress",
                        description: "",
                        region: "sfo3",
                        ip_range: "10.80.0.0/16",
                        default: false,
                        urn: "do:vpc:vpc-sfo",
                        created_at: ""
                    }
                ],
                "kiwipress",
                "nyc3"
            )
        ).toThrow(/exists in region "sfo3" \(id vpc-sfo\), not "nyc3"/);
    });

    it("fails when multiple VPCs share the name", () => {
        expect(() =>
            adoptVPC(
                [
                    {
                        id: "vpc-a",
                        name: "kiwipress",
                        description: "",
                        region: "nyc3",
                        ip_range: "10.80.0.0/16",
                        default: false,
                        urn: "do:vpc:a",
                        created_at: ""
                    },
                    {
                        id: "vpc-b",
                        name: "kiwipress",
                        description: "",
                        region: "sfo3",
                        ip_range: "10.81.0.0/16",
                        default: false,
                        urn: "do:vpc:b",
                        created_at: ""
                    }
                ],
                "kiwipress",
                "nyc3"
            )
        ).toThrow(/VPC "kiwipress" is ambiguous: 2 live resources named "kiwipress" \(ids: vpc-a, vpc-b\)/);
    });

    it("adopts unique droplets and firewalls by name", () => {
        expect(
            adoptDroplet(
                [
                    { id: 1, name: "other", memory: 1024, status: "active", image: {}, size: {} },
                    { id: 321, name: "kiwipress-01", memory: 1024, status: "active", image: {}, size: {} }
                ],
                "kiwipress-01"
            )?.id
        ).toBe(321);
        expect(
            adoptFirewall(
                [
                    { id: "fw-1", name: "kiwipress", status: "succeeded", inbound_rules: [], outbound_rules: [] }
                ],
                "kiwipress"
            )?.id
        ).toBe("fw-1");
    });

    it("fails when droplet or firewall names are ambiguous", () => {
        expect(() =>
            adoptDroplet(
                [
                    { id: 1, name: "web", memory: 1024, status: "active", image: {}, size: {} },
                    { id: 2, name: "web", memory: 1024, status: "active", image: {}, size: {} }
                ],
                "web"
            )
        ).toThrow(/Droplet "web" is ambiguous: 2 live resources named "web" \(ids: 1, 2\)/);
        expect(() =>
            adoptFirewall(
                [
                    { id: "fw-a", name: "web", status: "succeeded", inbound_rules: [], outbound_rules: [] },
                    { id: "fw-b", name: "web", status: "succeeded", inbound_rules: [], outbound_rules: [] }
                ],
                "web"
            )
        ).toThrow(/Firewall "web" is ambiguous: 2 live resources named "web" \(ids: fw-a, fw-b\)/);
    });
});
