import { StepTracker, type StepId } from "./StepTracker";
import { OrderSummary } from "./OrderSummary";

type LayoutOpts = {
    step: StepId;
    children?: unknown;
};

const HIDE_STEP_TRACKER: ReadonlySet<StepId> = new Set<StepId>(["live", "blueprints", "scale"]);
const HIDE_SIDEBAR: ReadonlySet<StepId> = new Set<StepId>(["live", "provisioning", "blueprints", "scale"]);

export function WizardLayout({ step, children }: LayoutOpts) {
    const showTracker = !HIDE_STEP_TRACKER.has(step);
    const showSummary = !HIDE_SIDEBAR.has(step);

    return (
        <div wizard-shell>
            <header wizard-header>
                <div container row gap="cozy">
                    <div brand>
                        <span logo>KiwiPress</span>
                        <span badge>Managed Hosting</span>
                    </div>
                    <button btn="ghost" type="button" aria-label="Toggle theme">
                        <i icon="moon" lib="solid" iconSize="sm"></i>
                    </button>
                </div>
            </header>

            <div wizard-body>
                {showTracker
                    ? <aside wizard-rail="left"><StepTracker active={step} /></aside>
                    : null}

                <main wizard-content data-step={step}>
                    {children}
                </main>

                {showSummary
                    ? <aside wizard-rail="right"><OrderSummary /></aside>
                    : null}
            </div>
        </div>
    );
}
