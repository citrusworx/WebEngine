import type { TLDs } from "../types/tlds.js";
export type AvailabilityQuery = {
    name: string;
    tlds: TLDs[];
};
export type AvailabilityStatus = "available" | "taken" | "unknown";
export type AvailabilityResult = {
    domain: string;
    status: AvailabilityStatus;
    raw?: string;
};
