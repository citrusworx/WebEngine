import type { FirewallRule, FirewallRuleSources } from "../providers/digitalocean/firewall/firewall.js";

/** Convenience rule from grape YAML before DigitalOcean mapping. */
export interface ConvenienceFirewallRule {
    protocol: string;
    ports?: string | number;
    sources?: string[] | FirewallRuleSources;
    destinations?: string[] | FirewallRuleSources;
}

const ALL_PORTS = "1-65535";

function isIcmp(protocol: string): boolean {
    return protocol.trim().toLowerCase() === "icmp";
}

function isAllPortsAlias(token: string): boolean {
    const normalized = token.trim().toLowerCase();
    return normalized === "all" || normalized === "*";
}

/**
 * Expand a convenience `ports` value into DigitalOcean-valid strings.
 * tcp/udp: `all` / `All` / `*` → `1-65535`; comma lists become one token each.
 * icmp: always omit ports (DO rejects `all` and does not need a range).
 */
export function expandFirewallPorts(protocol: string, ports?: string | number): string[] | undefined {
    if (isIcmp(protocol)) {
        return undefined;
    }
    if (ports === undefined) {
        return undefined;
    }

    const raw = String(ports).trim();
    if (!raw) {
        return undefined;
    }

    const tokens = raw
        .split(",")
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
        .map((token) => (isAllPortsAlias(token) ? ALL_PORTS : token));

    return tokens.length ? tokens : undefined;
}

export function sourceFromList(values?: string[] | FirewallRuleSources): FirewallRuleSources | undefined {
    if (!values) {
        return undefined;
    }
    if (!Array.isArray(values)) {
        return values;
    }

    const addresses: string[] = [];
    const tags: string[] = [];
    const droplet_ids: number[] = [];

    for (const value of values) {
        if (value.startsWith("tag:")) {
            tags.push(value.slice(4));
        } else if (value.startsWith("droplet:")) {
            droplet_ids.push(Number(value.slice(8)));
        } else {
            addresses.push(value);
        }
    }

    return {
        ...(addresses.length ? { addresses } : {}),
        ...(tags.length ? { tags } : {}),
        ...(droplet_ids.length ? { droplet_ids } : {})
    };
}

function mappedRule(
    protocol: string,
    ports: string | undefined,
    sources?: FirewallRuleSources,
    destinations?: FirewallRuleSources
): FirewallRule {
    return {
        protocol,
        ...(ports !== undefined ? { ports } : {}),
        ...(sources !== undefined ? { sources } : {}),
        ...(destinations !== undefined ? { destinations } : {})
    };
}

/** Map convenience inbound/outbound rules to DigitalOcean `inbound_rules` / `outbound_rules`. */
export function normalizeFirewallRules(rules?: ConvenienceFirewallRule[]): FirewallRule[] | undefined {
    if (!rules?.length) {
        return undefined;
    }

    const normalized: FirewallRule[] = [];
    for (const rule of rules) {
        const sources = sourceFromList(rule.sources);
        const destinations = sourceFromList(rule.destinations);
        const ports = expandFirewallPorts(rule.protocol, rule.ports);

        if (!ports?.length) {
            normalized.push(mappedRule(rule.protocol, undefined, sources, destinations));
            continue;
        }

        for (const port of ports) {
            normalized.push(mappedRule(rule.protocol, port, sources, destinations));
        }
    }
    return normalized;
}
