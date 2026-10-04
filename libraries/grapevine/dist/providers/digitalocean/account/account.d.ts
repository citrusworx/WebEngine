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
    team?: {
        uuid: string;
        name: string;
    };
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
    team?: {
        uuid?: string;
        name?: string;
    };
}
export declare function toAccountSummary(account: AccountPayload): AccountSummary;
export declare function getAccountSummary(): Promise<AccountSummary>;
export {};
