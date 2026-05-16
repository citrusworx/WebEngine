import type { Registrar, DnsHost } from "../types/providers.js";
import type { AvailabilityQuery, AvailabilityResult } from "./availability.js";

export type ContactRef = number | -1;

export interface RegisterDomainInput {
    domain: string;
    years: number;
    nameservers: string[];
    contacts: {
        registrant: ContactRef;
        admin: ContactRef;
        tech: ContactRef;
        billing: ContactRef;
    };
    autoRenew: boolean;
    privacy?: {
        purchase?: boolean;
        protect?: boolean;
    };
    extras?: Record<string, string>;
}

export interface RegistrarProvider {
    readonly name: Registrar;
    register(input: RegisterDomainInput): Promise<unknown>;
    renew(input: unknown): Promise<unknown>;
    transfer(input: unknown): Promise<unknown>;
    restore(input: unknown): Promise<unknown>;
    search(query: AvailabilityQuery): Promise<AvailabilityResult[]>;
}

export interface DnsHostProvider {
    readonly name: DnsHost;
    getNameservers(input: unknown): Promise<unknown>;
    setNameservers(input: unknown): Promise<unknown>;
    updateRecords(input: unknown): Promise<unknown>;
}

export type DnsProvider = RegistrarProvider | DnsHostProvider | (RegistrarProvider & DnsHostProvider);
