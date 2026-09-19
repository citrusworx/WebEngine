import { router } from "../../../router";
import { DashboardLayout } from "../layout/DashboardLayout";
import { BLUEPRINTS } from "../catalog";
import { simulateAction } from "../state";

export function Blueprints() {
    return (
        <DashboardLayout page="blueprints">
            <div dashboard-page>
                <header page-header>
                    <h1>Blueprints</h1>
                    <p lede>
                        Pre-configured architectures for common use cases. Each blueprint includes optimized modules, adapters, and infrastructure.
                    </p>
                </header>

                <div tile-grid="blueprints">
                    {BLUEPRINTS.map(blueprint => (
                        <div panel-card>
                            <div tile-head>
                                <div row gap="cozy">
                                    <div choice-icon>
                                        <i icon={blueprint.icon} lib="solid" iconSize="sm"></i>
                                    </div>
                                    <div>
                                        <h3>{blueprint.name}</h3>
                                        <p subtle>{blueprint.description}</p>
                                    </div>
                                </div>
                            </div>
                            <p subtle>Included Modules</p>
                            <div chip-wrap>
                                {blueprint.modules.map(module => (
                                    <span chip>{module}</span>
                                ))}
                            </div>
                            <div blueprint-meta>
                                <span>
                                    <i icon="layer-group" lib="solid" iconSize="sm"></i>
                                    Deployment: <strong>{blueprint.deployment}</strong>
                                </span>
                                <span>
                                    <i icon="server" lib="solid" iconSize="sm"></i>
                                    Resources: <strong>{blueprint.resources}</strong>
                                </span>
                                <span>
                                    <i icon="dollar-sign" lib="solid" iconSize="sm"></i>
                                    Starting at: <strong>{blueprint.estimate}</strong>
                                </span>
                            </div>
                            <button
                                type="button"
                                full
                                onclick={() => {
                                    simulateAction(`Applying ${blueprint.name} to a new project…`);
                                    router.navigate("/wizard/blueprints");
                                }}
                            >
                                Apply to New Project
                                <i icon="arrow-right" lib="solid" iconSize="sm"></i>
                            </button>
                        </div>
                    ))}
                </div>

                <div panel-card dashed>
                    <div choice-icon>
                        <i icon="box" lib="solid" iconSize="sm"></i>
                    </div>
                    <h3>Custom Blueprint</h3>
                    <p subtle>
                        Need something different? Build a custom configuration from scratch with full control over modules, adapters, and infrastructure.
                    </p>
                    <button btn="outline" type="button" onclick={() => router.navigate("/wizard/configure")}>
                        Start from Scratch
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
