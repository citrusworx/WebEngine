import type { ApplyResult } from "../config/apply.js";
import type { DestroyResult, DestroyTarget } from "../config/destroy.js";
import type { GrapePlan } from "../config/plan.js";
import type { LiveInventory } from "../config/live.js";
export declare function renderPlan(plan: GrapePlan, heading?: string): void;
export declare function renderValidate(plan: GrapePlan, source: string, heading?: string): void;
export declare function renderApply(result: ApplyResult): void;
export declare function renderDestroy(result: DestroyResult): void;
export declare function destroySummary(targets: DestroyTarget[]): string;
export interface StatusOverlap {
    kind: string;
    name: string;
    state: "present" | "missing";
    id?: string | number;
    extra?: string;
}
export declare function overlapWithConfig(plan: GrapePlan, inventory: LiveInventory): StatusOverlap[];
export declare function renderLiveStatus(inventory: LiveInventory): void;
export declare function renderOverlap(rows: StatusOverlap[]): void;
