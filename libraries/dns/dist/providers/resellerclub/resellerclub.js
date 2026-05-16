const RESELLERCLUB_BASE = "https://domaincheck.httpapi.com/api";
function statusFor(record) {
    if (!record)
        return "unknown";
    if (record.status === "available")
        return "available";
    if (record.status === "regthroughus" || record.status === "regthroughothers")
        return "taken";
    return "unknown";
}
export class ResellerClub {
    name = "resellerclub";
    authUserId;
    apiKey;
    constructor(authUserId, apiKey) {
        this.authUserId = authUserId;
        this.apiKey = apiKey;
    }
    async search(query) {
        if (!query.name)
            return [];
        if (query.tlds.length === 0)
            return [];
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
        const payload = await res.json();
        return query.tlds.map((tld) => {
            const domain = `${query.name}.${tld}`;
            const record = payload[domain];
            return {
                domain,
                status: statusFor(record),
                raw: record?.status
            };
        });
    }
    register(_input) {
        throw new Error("ResellerClub.register not implemented");
    }
    renew(_input) {
        throw new Error("ResellerClub.renew not implemented");
    }
    transfer(_input) {
        throw new Error("ResellerClub.transfer not implemented");
    }
    restore(_input) {
        throw new Error("ResellerClub.restore not implemented");
    }
}
//# sourceMappingURL=resellerclub.js.map