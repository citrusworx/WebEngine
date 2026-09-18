import { Signal, effect } from "@citrusworx/sigjs";
import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";

type StepStatus = "pending" | "running" | "completed";

type ProvisionStep = {
    id: string;
    label: string;
    status: StepStatus;
    timestamp?: string;
    logs?: string[];
};

const INITIAL_STEPS: ProvisionStep[] = [
    { id: "droplet", label: "Droplet Create", status: "pending" },
    { id: "docker", label: "Docker Install", status: "pending" },
    { id: "stack", label: "Stack Deploy", status: "pending" },
    { id: "db", label: "DB Init", status: "pending" },
    { id: "backup", label: "Backup Setup", status: "pending" },
    { id: "health", label: "Health Check", status: "pending" },
    { id: "ssl", label: "SSL Issue", status: "pending" },
    { id: "complete", label: "Provision Complete", status: "pending" }
];

const MOCK_LOGS: Record<string, string[]> = {
    droplet: [
        "Creating droplet in selected region...",
        "Allocating compute and storage...",
        "Assigning IP: 167.99.123.45",
        "Droplet created successfully"
    ],
    docker: [
        "Updating apt packages...",
        "Installing Docker Engine 24.0.7...",
        "Configuring Docker daemon...",
        "Docker installed and running"
    ],
    stack: [
        "Pulling WordPress image...",
        "Pulling Nginx image...",
        "Creating network bridge...",
        "Starting containers...",
        "Stack deployed successfully"
    ],
    db: [
        "Connecting to managed Postgres...",
        "Creating database: kiwipress_prod",
        "Running migrations...",
        "Database initialized"
    ],
    backup: [
        "Configuring backup schedule...",
        "Setting retention policy...",
        "Testing backup system...",
        "Backup configured successfully"
    ],
    health: [
        "Running health checks...",
        "WordPress: healthy",
        "Database: connected",
        "All systems operational"
    ],
    ssl: [
        "Requesting Let's Encrypt certificate...",
        "Domain validation in progress...",
        "Certificate issued successfully",
        "HTTPS enabled"
    ],
    complete: [
        "Finalizing configuration...",
        "Running post-deployment scripts...",
        "Instance is live and ready"
    ]
};

export function Provisioning() {
    let bodyNode: HTMLElement | null = null;
    const steps = Signal<ProvisionStep[]>(INITIAL_STEPS.map(step => ({ ...step })));
    const expanded = Signal<string | null>(null);
    const cursor = Signal(0);

    function paint() {
        if (!bodyNode) return;
        const current = steps.get();
        const open = expanded.get();
        const completedCount = current.filter(step => step.status === "completed").length;
        const progress = Math.round((completedCount / current.length) * 100);

        bodyNode.replaceChildren(
            <div>
                <div provision-head>
                    <div header-row>
                        <div>
                            <h1>Provisioning Your Instance</h1>
                            <p subtle>{completedCount} of {current.length} steps completed</p>
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
                                                : <span>{index + 1}</span>}
                                    </div>
                                    <div>
                                        <h4>
                                            {step.label}
                                            {step.status === "running" ? <span pill="accent"> Running</span> : null}
                                            {step.status === "completed" ? <span pill="accent"> Completed</span> : null}
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

                    <div note>
                        <p>Provisioning is simulated in this preview. No DigitalOcean or GrapeVine calls are made. You can keep this tab open while the timeline advances.</p>
                    </div>
                </div>
            </div> as Node
        );

        const fill = bodyNode.querySelector("[provision-fill]") as HTMLElement | null;
        if (fill) fill.style.width = `${progress}%`;
    }

    effect(() => {
        steps.get();
        expanded.get();
        paint();
    });

    effect(() => {
        const timer = window.setInterval(() => {
            const index = cursor.get();
            const current = steps.get().map(step => ({ ...step }));

            if (index > 0 && current[index - 1]) {
                current[index - 1] = {
                    ...current[index - 1],
                    status: "completed",
                    timestamp: new Date().toLocaleTimeString(),
                    logs: MOCK_LOGS[current[index - 1].id]
                };
            }

            if (index < current.length) {
                current[index] = { ...current[index], status: "running" };
                steps.set(current);
                cursor.set(index + 1);
                return;
            }

            steps.set(current);
            window.clearInterval(timer);
            window.setTimeout(() => router.navigate("/wizard/live"), 2000);
        }, 2000);

        return () => window.clearInterval(timer);
    });

    return (
        <WizardLayout step="provisioning">
            <div step-page="provisioning">
                <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
            </div>
        </WizardLayout>
    );
}
