import type { AvailabilityQuery, AvailabilityResult } from "./availability.js";
import type { RegistrarProvider } from "./provider.js";
export declare class DNS {
    private registrar;
    constructor(registrar: RegistrarProvider);
    availability(query: AvailabilityQuery): Promise<AvailabilityResult[]>;
}
