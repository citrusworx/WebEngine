export type StepId =
    | "welcome"
    | "blueprints"
    | "configure"
    | "database"
    | "domain"
    | "payment"
    | "provisioning"
    | "live"
    | "scale";

type Step = {
    id: StepId;
    path: string;
    label: string;
    description: string;
};

export const VISIBLE_STEPS: Step[] = [
    { id: "welcome",      path: "/wizard/welcome",      label: "Welcome",            description: "Deploy your instance" },
    { id: "configure",    path: "/wizard/configure",    label: "Configure Instance", description: "Select resources" },
    { id: "database",     path: "/wizard/database",     label: "Database",           description: "Configure storage" },
    { id: "domain",       path: "/wizard/domain",       label: "Domain & CDN",       description: "Connect domain" },
    { id: "payment",      path: "/wizard/payment",      label: "Payment",            description: "Lock & provision" },
    { id: "provisioning", path: "/wizard/provisioning", label: "Provisioning",       description: "Stack deployment" }
];

export function StepTracker({ active }: { active: StepId }) {
    const activeIndex = VISIBLE_STEPS.findIndex(s => s.id === active);

    return (
        <div step-tracker>
            <header>
                <h3 eyebrow>Deployment Progress</h3>
                <p>Step {activeIndex + 1} of {VISIBLE_STEPS.length}</p>
            </header>

            <ol steps>
                {VISIBLE_STEPS.map((step, index) => {
                    const state = index < activeIndex
                        ? "completed"
                        : index === activeIndex
                            ? "active"
                            : "pending";

                    return (
                        <li step={state}>
                            <div step-indicator>
                                {state === "completed"
                                    ? <i icon="check" lib="solid" iconSize="sm"></i>
                                    : <span>{index + 1}</span>}
                            </div>
                            <div step-body>
                                <h4>{step.label}</h4>
                                <p>{step.description}</p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
