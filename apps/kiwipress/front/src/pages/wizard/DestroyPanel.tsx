import {
    DESTROY_CONFIRM_COPY,
    beginDestroyConfirm,
    cancelDestroyConfirm,
    describeTargets,
    destroyError,
    destroyPhase,
    destroySummary,
    runDestroyStack
} from "./destroy-flow";

type DestroyPanelOpts = {
    compact?: boolean;
    showIdleButton?: boolean;
};

export function DestroyPanel({ compact = false, showIdleButton = true }: DestroyPanelOpts) {
    const phase = destroyPhase.get();
    const error = destroyError.get();
    const summary = destroySummary.get();
    const busy = phase === "running";
    const confirmOpen = phase === "confirm" || phase === "running" || phase === "error";

    return (
        <div panel-card danger-panel>
            <h3>{summary && phase === "done" ? "Stack torn down" : "Destroy this stack"}</h3>
            <p>
                {phase === "done"
                    ? "GrapeVine reported the DigitalOcean teardown below. The dashboard no longer treats this instance as live."
                    : DESTROY_CONFIRM_COPY}
            </p>

            {error ? <p>{error}</p> : null}

            {summary
                ? <div destroy-summary>
                    <p subtle>Pack {summary.packId}{summary.region ? ` · ${summary.region}` : ""}</p>
                    <p subtle>Deleted: {describeTargets(summary.deleted)}</p>
                    <p subtle>Skipped: {describeTargets(summary.skipped)}</p>
                    <p subtle>Failed: {describeTargets(summary.failed)}</p>
                    {summary.warnings.map((warning) => <p subtle>{warning}</p>)}
                </div>
                : null}

            <div row gap="cozy" destroy-actions>
                {showIdleButton && !confirmOpen && phase !== "done"
                    ? <button
                        danger
                        type="button"
                        scale={compact ? "sm" : undefined}
                        disabled={busy}
                        onclick={beginDestroyConfirm}
                    >
                        <i icon="trash" lib="solid" iconSize="sm"></i>
                        Destroy
                    </button>
                    : null}

                {confirmOpen
                    ? <>
                        <button
                            btn="outline"
                            type="button"
                            scale={compact ? "sm" : undefined}
                            disabled={busy}
                            onclick={cancelDestroyConfirm}
                        >
                            Cancel
                        </button>
                        <button
                            danger
                            type="button"
                            scale={compact ? "sm" : undefined}
                            disabled={busy}
                            onclick={() => { void runDestroyStack(); }}
                        >
                            {busy ? "Destroying…" : "Yes, delete DigitalOcean resources"}
                        </button>
                    </>
                    : null}

                {phase === "done"
                    ? <button
                        btn="outline"
                        type="button"
                        scale={compact ? "sm" : undefined}
                        disabled={busy}
                        onclick={() => { void runDestroyStack(); }}
                    >
                        Run destroy again
                    </button>
                    : null}
            </div>
        </div>
    );
}
