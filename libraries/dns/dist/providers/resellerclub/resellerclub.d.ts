import type { RegistrarProvider, RegisterDomainInput } from "../../core/provider.js";
import type { AvailabilityQuery, AvailabilityResult } from "../../core/availability.js";
export declare class ResellerClub implements RegistrarProvider {
    readonly name: "resellerclub";
    private readonly authUserId;
    private readonly apiKey;
    constructor(authUserId: number, apiKey: string);
    search(query: AvailabilityQuery): Promise<AvailabilityResult[]>;
    register(_input: RegisterDomainInput): Promise<unknown>;
    renew(_input: unknown): Promise<unknown>;
    transfer(_input: unknown): Promise<unknown>;
    restore(_input: unknown): Promise<unknown>;
}
