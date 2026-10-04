import { doRequest } from "../client.js";
export function toAccountSummary(account) {
    const team = account.team?.uuid && account.team.name
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
export async function getAccountSummary() {
    const response = await doRequest({
        method: "GET",
        url: "/account"
    });
    return toAccountSummary(response.account);
}
//# sourceMappingURL=account.js.map