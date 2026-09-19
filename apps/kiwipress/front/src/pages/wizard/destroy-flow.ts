import { Signal } from "@citrusworx/sigjs";
import { destroyProvision, type DestroyResponse, type DestroyTargetSummary } from "./provision";
import { markLiveDestroyed, wizardData } from "./state";

export type DestroyPhase = "idle" | "confirm" | "running" | "done" | "error";

export const destroyPhase = Signal<DestroyPhase>("idle");
export const destroyError = Signal<string | null>(null);
export const destroySummary = Signal<DestroyResponse | null>(null);

export const DESTROY_CONFIRM_COPY =
    "This permanently deletes the DigitalOcean resources for this KiwiPress stack (droplet, network, and managed databases if you chose dedicated). Leaving the stack running continues to incur provider charges; tearing it down is irreversible. Local .grape/ssh private keys are not removed.";

export function beginDestroyConfirm(): void {
    if (destroyPhase.get() === "running") {
        return;
    }
    destroyError.set(null);
    destroyPhase.set("confirm");
}

export function cancelDestroyConfirm(): void {
    if (destroyPhase.get() === "running") {
        return;
    }
    if (destroyPhase.get() === "done") {
        return;
    }
    destroyPhase.set(destroySummary.get() ? "done" : "idle");
}

export async function runDestroyStack(): Promise<void> {
    if (destroyPhase.get() === "running") {
        return;
    }

    destroyPhase.set("running");
    destroyError.set(null);

    try {
        const result = await destroyProvision(wizardData.get());
        destroySummary.set(result);
        markLiveDestroyed();
        destroyPhase.set("done");
    } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Destroy request failed.";
        destroyError.set(message);
        destroyPhase.set("error");
    }
}

export function describeTargets(targets: DestroyTargetSummary[]): string {
    if (targets.length === 0) {
        return "none";
    }
    return targets
        .map((target) => {
            const extra = target.reason || target.error;
            return extra ? `${target.kind} ${target.name} (${extra})` : `${target.kind} ${target.name}`;
        })
        .join(", ");
}
