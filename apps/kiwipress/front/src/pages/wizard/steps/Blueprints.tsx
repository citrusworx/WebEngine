import { effect } from "@citrusworx/sigjs";
import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";
import { updateWizard, wizardData } from "../state";
import type { DeploymentMode } from "../state";
import { BLUEPRINTS } from "../catalog";
import type { BlueprintDef } from "../catalog";

function selectMode(mode: DeploymentMode) {
    updateWizard({ deploymentMode: mode });
}

function selectBlueprint(blueprint: BlueprintDef) {
    updateWizard({
        blueprintId: blueprint.id,
        dropletSize: blueprint.dropletSize,
        cdnEnabled: blueprint.id === "business",
        loadBalancer: blueprint.id === "business"
    });
}

export function Blueprints() {
    let bodyNode: HTMLElement | null = null;

    function next() {
        const data = wizardData.get();
        if (data.deploymentMode === "performance" && !data.blueprintId) return;
        router.navigate("/wizard/configure");
    }

    function back() { router.navigate("/wizard/welcome"); }
    function skip() { router.navigate("/wizard/configure"); }

    function paint() {
        if (!bodyNode) return;
        const data = wizardData.get();

        bodyNode.replaceChildren(
            <div>
                <div section-block>
                    <h2 section-kicker>Choose Your Deployment Mode</h2>
                    <div choice-grid="2">
                        <button
                            type="button"
                            choice
                            selected={data.deploymentMode === "traditional"}
                            onclick={() => selectMode("traditional")}
                        >
                            <div choice-head>
                                <div choice-icon><i icon="layer-group" lib="solid" iconSize="sm"></i></div>
                                {data.deploymentMode === "traditional"
                                    ? <span choice-check><i icon="check" lib="solid" iconSize="sm"></i></span>
                                    : null}
                            </div>
                            <h3>Traditional WordPress</h3>
                            <p>Standard optimized WordPress deployment with familiar monolithic workflow, safe defaults, and full plugin flexibility.</p>
                            <ul module-list>
                                <li><i icon="check" lib="solid" iconSize="sm"></i>Familiar WordPress experience</li>
                                <li><i icon="check" lib="solid" iconSize="sm"></i>Theme &amp; plugin ecosystem</li>
                                <li><i icon="check" lib="solid" iconSize="sm"></i>All-in-one deployment</li>
                            </ul>
                        </button>

                        <button
                            type="button"
                            choice
                            selected={data.deploymentMode === "performance"}
                            onclick={() => selectMode("performance")}
                        >
                            <span ribbon>Recommended</span>
                            <div choice-head>
                                <div choice-icon><i icon="rocket" lib="solid" iconSize="sm"></i></div>
                                {data.deploymentMode === "performance"
                                    ? <span choice-check><i icon="check" lib="solid" iconSize="sm"></i></span>
                                    : null}
                            </div>
                            <h3>KiwiPress Performance Mode</h3>
                            <p>WordPress as content backend with KiwiPress frontend runtime. Structured themes, API-driven delivery, and optimized performance.</p>
                            <ul module-list>
                                <li><i icon="check" lib="solid" iconSize="sm"></i>Maximum performance</li>
                                <li><i icon="check" lib="solid" iconSize="sm"></i>Structured theme database</li>
                                <li><i icon="check" lib="solid" iconSize="sm"></i>Future-ready architecture</li>
                                <li><i icon="check" lib="solid" iconSize="sm"></i>API-first delivery</li>
                            </ul>
                        </button>
                    </div>
                </div>

                {data.deploymentMode === "performance"
                    ? <div section-block>
                        <div>
                            <h3 section-kicker>
                                Choose a Blueprint
                                <span>Pre-configured stacks optimized for common use cases</span>
                            </h3>
                        </div>
                        <div choice-grid="2">
                            {BLUEPRINTS.map(blueprint => {
                                const selected = data.blueprintId === blueprint.id;
                                return (
                                    <button
                                        type="button"
                                        choice
                                        selected={selected}
                                        onclick={() => selectBlueprint(blueprint)}
                                    >
                                        {selected
                                            ? <span choice-check><i icon="check" lib="solid" iconSize="sm"></i></span>
                                            : null}
                                        <div choice-head>
                                            <div choice-icon><i icon={blueprint.icon} lib="solid" iconSize="sm"></i></div>
                                            <div choice-price>
                                                <p subtle>Starting at</p>
                                                <strong>${blueprint.price}</strong>
                                                <span>/mo</span>
                                            </div>
                                        </div>
                                        <h3>{blueprint.title}</h3>
                                        <p>{blueprint.description}</p>
                                        <span pill="accent">Recommended: {blueprint.recommendedTier}</span>
                                        <div>
                                            <h4>Included Modules</h4>
                                            <ul module-list>
                                                {blueprint.modules.slice(0, 4).map(module => (
                                                    <li><i icon="check" lib="solid" iconSize="sm"></i>{module}</li>
                                                ))}
                                                {blueprint.modules.length > 4
                                                    ? <li>+{blueprint.modules.length - 4} more…</li>
                                                    : null}
                                            </ul>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    : null}

                <nav step-nav row gap="cozy">
                    <button btn="outline" type="button" onclick={back}>
                        <i icon="arrow-left" lib="solid" iconSize="sm"></i>
                        Back
                    </button>
                    <button
                        type="button"
                        onclick={next}
                        disabled={data.deploymentMode === "performance" && !data.blueprintId}
                    >
                        Continue to Configuration
                        <i icon="arrow-right" lib="solid" iconSize="sm"></i>
                    </button>
                </nav>

                <div skip-row>
                    <button btn="text" type="button" onclick={skip}>Skip and configure manually</button>
                </div>
            </div> as Node
        );
    }

    effect(() => {
        wizardData.get();
        paint();
    });

    return (
        <WizardLayout step="blueprints">
            <div step-page="blueprints">
                <header step-header>
                    <h1>Choose Your Deployment Mode</h1>
                    <p lede>Select how you want to build and deploy your platform, then start from a curated stack or configure manually.</p>
                </header>
                <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
            </div>
        </WizardLayout>
    );
}
