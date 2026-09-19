import { Signal, effect } from "@citrusworx/sigjs";
import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";
import { applyProvision, getProvisionJob, planProvision, type ProvisionStep } from "../provision";
import { seedLiveInstance, wizardData } from "../state";

type Phase = "planning" | "applying" | "failed" | "succeeded";

export function Provisioning() {
    let bodyNode: HTMLElement | null = null;
    const steps = Signal<ProvisionStep[]>([]);
    const expanded = Signal<string | null>(null);
    const phase = Signal<Phase>("planning");
    const error = Signal<string | null>(null);
    const warnings = Signal<string[]>([]);
    const packLabel = Signal<string>("");

    function paint() {
        if (!bodyNode) return;
        const current = steps.get();
        const open = expanded.get();
        const currentPhase = phase.get();
        const currentError = error.get();
        const currentWarnings = warnings.get();
        const completedCount = current.filter(step => step.status === "completed").length;
        const progress = current.length === 0 ? 0 : Math.round((completedCount / current.length) * 100);
        const busy = currentPhase === "planning" || currentPhase === "applying";

        bodyNode.replaceChildren(
            <div>
                <div provision-head>
                    <div header-row>
                        <div>
                            <h1>Provisioning Your Instance</h1>
                            <p subtle>
                                {current.length === 0
                                    ? currentPhase === "planning"
                                        ? "Planning infrastructure with GrapeVine…"
                                        : "Waiting for a plan"
                                    : `${completedCount} of ${current.length} steps completed`}
                                {packLabel.get() ? ` · ${packLabel.get()}` : ""}
                            </p>
                        </div>
                        <div provision-pct>
                            <strong>{progress}%</strong>
                            <p subtle>Progress</p>
                        </div>
                    </div>
                    <div provision-meter>
                        <span provision-fill></span>
                    </div>
                </div>

                <div timeline>
                    {current.map((step, index) => (
                        <div timeline-step step={step.status}>
                            <div choice-head>
                                <div row gap="cozy">
                                    <div choice-icon>
                                        {step.status === "completed"
                                            ? <i icon="check" lib="solid" iconSize="sm"></i>
                                            : step.status === "running"
                                                ? <i icon="circle-notch" lib="solid" iconSize="sm" spin></i>
                                                : step.status === "failed"
                                                    ? <i icon="xmark" lib="solid" iconSize="sm"></i>
                                                    : <span>{index + 1}</span>}
                                    </div>
                                    <div>
                                        <h4>
                                            {step.label}
                                            {step.status === "running" ? <span pill="accent"> Running</span> : null}
                                            {step.status === "completed" ? <span pill="accent"> Completed</span> : null}
                                            {step.status === "failed" ? <span pill="warm"> Failed</span> : null}
                                        </h4>
                                        {step.timestamp ? <p subtle>{step.timestamp}</p> : null}
                                    </div>
                                </div>
                                {step.logs
                                    ? <button
                                        btn="ghost"
                                        type="button"
                                        onclick={() => expanded.set(open === step.id ? null : step.id)}
                                    >
                                        <i icon={open === step.id ? "chevron-up" : "chevron-down"} lib="solid" iconSize="sm"></i>
                                    </button>
                                    : null}
                            </div>
                            {open === step.id && step.logs
                                ? <div step-logs>
                                    {step.logs.map(line => <p>{line}</p>)}
                                </div>
                                : null}
                        </div>
                    ))}

                    {currentError
                        ? <div note provision-error>
                            <p>{currentError}</p>
                            <button btn="outline" type="button" disabled={busy} onclick={() => { void run(true); }}>
                                Retry apply
                            </button>
                        </div>
                        : <div note>
                            <p>
                                {currentPhase === "planning"
                                    ? "Asking the KiwiPress API to plan a GrapeVine apply. No DigitalOcean token is required for plan."
                                    : currentPhase === "applying"
                                        ? "Apply is running on the API server. The browser never sees DO_TOKEN or database passwords."
                                        : currentPhase === "succeeded"
                                            ? "Apply finished. Opening the live instance."
                                            : "Apply did not run. Fix the API error and retry. Plan can succeed without DO_TOKEN; apply cannot."}
                            </p>
                        </div>}

                    {currentWarnings.length
                        ? <div note>
                            {currentWarnings.map(warning => <p subtle>{warning}</p>)}
                        </div>
                        : null}
                </div>
            </div> as Node
        );

        const fill = bodyNode.querySelector("[provision-fill]") as HTMLElement | null;
        if (fill) fill.style.width = `${progress}%`;
    }

    async function pollJob(id: string, cancelled: () => boolean): Promise<void> {
        while (!cancelled()) {
            const job = await getProvisionJob(id);
            if (cancelled()) return;
            steps.set(job.steps);
            if (job.status === "succeeded") {
                const droplet = job.result?.droplets[0];
                const database = job.result?.databases[0];
                const data = wizardData.get();
                seedLiveInstance({
                    ip: droplet?.ip || "",
                    domain: job.result?.domain || data.domainName,
                    dropletId: droplet?.id,
                    databaseHost: database?.host,
                    databaseStatus: database?.status
                });
                phase.set("succeeded");
                window.setTimeout(() => {
                    if (cancelled()) return;
                    if (!document.querySelector("[step-page='provisioning']")) return;
                    router.navigate("/wizard/live");
                }, 1200);
                return;
            }
            if (job.status === "failed") {
                phase.set("failed");
                error.set(job.error || "GrapeVine apply failed.");
                return;
            }
            await new Promise(resolve => window.setTimeout(resolve, 1500));
        }
    }

    async function run(retryApply = false): Promise<void> {
        error.set(null);
        try {
            if (!retryApply || steps.get().length === 0) {
                phase.set("planning");
                const plan = await planProvision(wizardData.get());
                steps.set(plan.steps);
                warnings.set(plan.warnings ?? []);
                packLabel.set(`${plan.packId} · ${plan.doSize}`);
            }

            phase.set("applying");
            const job = await applyProvision(wizardData.get());
            steps.set(job.steps);
            await pollJob(job.id, () => stopped);
        } catch (caught) {
            const message = caught instanceof Error ? caught.message : "Provisioning request failed.";
            phase.set("failed");
            error.set(message);
            const current = steps.get();
            if (current.length) {
                const running = current.findIndex(step => step.status === "running");
                const index = running >= 0 ? running : 0;
                steps.set(current.map((step, stepIndex) => (
                    stepIndex === index
                        ? { ...step, status: "failed", logs: [...(step.logs ?? []), message] }
                        : step
                )));
            }
        }
    }

    effect(() => {
        steps.get();
        expanded.get();
        phase.get();
        error.get();
        warnings.get();
        packLabel.get();
        paint();
    });

    let stopped = false;
    effect(() => {
        stopped = false;
        void run();
        return () => {
            stopped = true;
        };
    });

    return (
        <WizardLayout step="provisioning">
            <div step-page="provisioning">
                <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
            </div>
        </WizardLayout>
    );
}
