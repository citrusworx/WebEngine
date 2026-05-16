import type { AvailabilityQuery, AvailabilityResult } from "./availability.js";
import type { RegistrarProvider } from "./provider.js";

export class DNS {
    private registrar: RegistrarProvider;

    constructor(registrar: RegistrarProvider) {
        this.registrar = registrar;
    }

    availability(query: AvailabilityQuery): Promise<AvailabilityResult[]> {
        return this.registrar.search(query) as Promise<AvailabilityResult[]>;
    }
}
