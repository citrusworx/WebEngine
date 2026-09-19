import { describe, expect, it } from "vitest";
import { expandFirewallPorts, normalizeFirewallRules } from "./firewall-rules.js";

describe("expandFirewallPorts", () => {
    it("maps all / All / * to 1-65535 for tcp and udp", () => {
        expect(expandFirewallPorts("tcp", "all")).toEqual(["1-65535"]);
        expect(expandFirewallPorts("tcp", "All")).toEqual(["1-65535"]);
        expect(expandFirewallPorts("udp", "*")).toEqual(["1-65535"]);
    });

    it("splits comma-separated lists, including spaces after commas", () => {
        expect(expandFirewallPorts("tcp", "80,443")).toEqual(["80", "443"]);
        expect(expandFirewallPorts("tcp", "80, 443")).toEqual(["80", "443"]);
    });

    it("omits ports for icmp, including all / empty / missing", () => {
        expect(expandFirewallPorts("icmp", "all")).toBeUndefined();
        expect(expandFirewallPorts("ICMP", "80")).toBeUndefined();
        expect(expandFirewallPorts("icmp", "")).toBeUndefined();
        expect(expandFirewallPorts("icmp")).toBeUndefined();
    });

    it("passes through single ports and hyphen ranges", () => {
        expect(expandFirewallPorts("tcp", "22")).toEqual(["22"]);
        expect(expandFirewallPorts("tcp", 22)).toEqual(["22"]);
        expect(expandFirewallPorts("udp", "8000-9000")).toEqual(["8000-9000"]);
    });
});

describe("normalizeFirewallRules", () => {
    it("expands comma lists into one rule per port with the same sources", () => {
        expect(
            normalizeFirewallRules([
                { protocol: "tcp", ports: "80,443", sources: ["0.0.0.0/0"] }
            ])
        ).toEqual([
            { protocol: "tcp", ports: "80", sources: { addresses: ["0.0.0.0/0"] } },
            { protocol: "tcp", ports: "443", sources: { addresses: ["0.0.0.0/0"] } }
        ]);
    });

    it("maps outbound all to 1-65535 and omits icmp ports", () => {
        expect(
            normalizeFirewallRules([
                { protocol: "tcp", ports: "all", destinations: ["0.0.0.0/0"] },
                { protocol: "icmp", ports: "all", destinations: ["0.0.0.0/0"] }
            ])
        ).toEqual([
            { protocol: "tcp", ports: "1-65535", destinations: { addresses: ["0.0.0.0/0"] } },
            { protocol: "icmp", destinations: { addresses: ["0.0.0.0/0"] } }
        ]);
    });

    it("passes through 22 and 8000-9000 without rewriting", () => {
        expect(
            normalizeFirewallRules([
                { protocol: "tcp", ports: "22", sources: ["203.0.113.10/32"] },
                { protocol: "tcp", ports: "8000-9000", sources: ["10.0.0.0/8"] }
            ])
        ).toEqual([
            { protocol: "tcp", ports: "22", sources: { addresses: ["203.0.113.10/32"] } },
            { protocol: "tcp", ports: "8000-9000", sources: { addresses: ["10.0.0.0/8"] } }
        ]);
    });

    it("returns undefined for an empty rule list", () => {
        expect(normalizeFirewallRules()).toBeUndefined();
        expect(normalizeFirewallRules([])).toBeUndefined();
    });
});
