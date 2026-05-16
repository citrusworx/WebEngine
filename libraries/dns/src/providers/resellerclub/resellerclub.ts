import type { RegistrarProvider, RegisterDomainInput } from "../../core/provider.js";
import type { AvailabilityQuery, AvailabilityResult } from "../../core/availability.js";
import type { TLDs } from "../../types/tlds.js";

const RESELLERCLUB_BASE = "https://domaincheck.httpapi.com/api";

type AvailabilityRecord = {
    status: string;
    classkey?: string;
};

type AvailabilityPayload = Record<string, AvailabilityRecord>;

function statusFor(record: AvailabilityRecord | undefined): AvailabilityResult["status"] {
    if (!record) return "unknown";
    if (record.status === "available") return "available";
    if (record.status === "regthroughus" || record.status === "regthroughothers") return "taken";
    return "unknown";
}

export class ResellerClub implements RegistrarProvider {
    readonly name = "resellerclub" as const;

    private readonly authUserId: number;
    private readonly apiKey: string;

    constructor(authUserId: number, apiKey: string) {
        this.authUserId = authUserId;
        this.apiKey = apiKey;
    }

    async search(query: AvailabilityQuery): Promise<AvailabilityResult[]> {
        if (!query.name) return [];
        if (query.tlds.length === 0) return [];

        const url = new URL(`${RESELLERCLUB_BASE}/domains/available.json`);
        url.searchParams.set("auth-userid", String(this.authUserId));
        url.searchParams.set("api-key", this.apiKey);
        url.searchParams.append("domain-name", query.name);
        for (const tld of query.tlds) {
            url.searchParams.append("tlds", tld);
        }

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`ResellerClub availability check failed (${res.status}): ${await res.text()}`);
        }

        const payload = await res.json() as AvailabilityPayload;

        return query.tlds.map<AvailabilityResult>((tld: TLDs) => {
            const domain = `${query.name}.${tld}`;
            const record = payload[domain];
            return {
                domain,
                status: statusFor(record),
                raw: record?.status
            };
        });
    }

    register(_input: RegisterDomainInput): Promise<unknown> {
        throw new Error("ResellerClub.register not implemented");
    }

    renew(_input: unknown): Promise<unknown> {
        throw new Error("ResellerClub.renew not implemented");
    }

    transfer(_input: unknown): Promise<unknown> {
        throw new Error("ResellerClub.transfer not implemented");
    }

    restore(_input: unknown): Promise<unknown> {
        throw new Error("ResellerClub.restore not implemented");
    }
}
