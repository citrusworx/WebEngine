import { doRequest } from "../client.js";

/** Fields Grapevine keeps from GET /account. Tokens are never part of this object. */
export interface AccountSummary {
    droplet_limit: number;
    floating_ip_limit?: number;
    reserved_ip_limit?: number;
    email: string;
    uuid: string;
    email_verified: boolean;
    status: string;
    status_message: string;
    team?: { uuid: string; name: string };
}

interface AccountPayload {
    droplet_limit: number;
    floating_ip_limit?: number;
    reserved_ip_limit?: number;
    email: string;
    uuid: string;
    email_verified: boolean;
    status: string;
    status_message?: string;
    team?: { uuid?: string; name?: string };
}

export function toAccountSummary(account: AccountPayload): AccountSummary {
    const team =
        account.team?.uuid && account.team.name
            ? { uuid: account.team.uuid, name: account.team.name }
            : undefined;
    return {
        droplet_limit: account.droplet_limit,
        floating_ip_limit: account.floating_ip_limit,
        reserved_ip_limit: account.reserved_ip_limit,
        email: account.email,
        uuid: account.uuid,
        email_verified: Boolean(account.email_verified),
        status: account.status,
        status_message: account.status_message ?? "",
        team
    };
}

export async function getAccountSummary(): Promise<AccountSummary> {
    const response = await doRequest<{ account: AccountPayload }>({
        method: "GET",
        url: "/account"
    });
    return toAccountSummary(response.account);
}
