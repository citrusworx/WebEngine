import type { FirewallRule, FirewallRuleSources } from "../providers/digitalocean/firewall/firewall.js";
/** Convenience rule from grape YAML before DigitalOcean mapping. */
export interface ConvenienceFirewallRule {
    protocol: string;
    ports?: string | number;
    sources?: string[] | FirewallRuleSources;
    destinations?: string[] | FirewallRuleSources;
}
/**
 * Expand a convenience `ports` value into DigitalOcean-valid strings.
 * tcp/udp: `all` / `All` / `*` → `1-65535`; comma lists become one token each.
 * icmp: always omit ports (DO rejects `all` and does not need a range).
 */
export declare function expandFirewallPorts(protocol: string, ports?: string | number): string[] | undefined;
export declare function sourceFromList(values?: string[] | FirewallRuleSources): FirewallRuleSources | undefined;
/** Stable identity for a full rule list. Order does not matter. */
export declare function firewallRulesKey(rules?: FirewallRule[]): string;
export declare function firewallRulesEqual(left?: FirewallRule[], right?: FirewallRule[]): boolean;
/** Map convenience inbound/outbound rules to DigitalOcean `inbound_rules` / `outbound_rules`. */
export declare function normalizeFirewallRules(rules?: ConvenienceFirewallRule[]): FirewallRule[] | undefined;
