import { MODULES } from "../catalog";
import { simulateAction } from "../state";

export function ModulesPanel() {
    return (
        <div section-block>
            <div section-kicker>
                <div>
                    Application Capabilities
                    <span>Core services powering your application functionality</span>
                </div>
                <button btn="ghost" type="button" onclick={() => simulateAction("Capability manager is simulated.")}>
                    Manage Capabilities
                </button>
            </div>
            <div tile-grid="modules">
                {MODULES.map(module => (
                    <div tile dim={!module.enabled || undefined}>
                        <div tile-head>
                            <div row gap="cozy">
                                <div choice-icon tone={module.enabled ? undefined : "quiet"}>
                                    <i icon="box" lib="solid" iconSize="sm"></i>
                                </div>
                                <div>
                                    <h3>{module.name}</h3>
                                    <p subtle>{module.version}</p>
                                </div>
                            </div>
                            <i
                                icon={module.enabled ? "circle-check" : "circle-xmark"}
                                lib="solid"
                                iconSize="sm"
                            ></i>
                        </div>
                        <p subtle>{module.description}</p>
                        <div tile-head>
                            <span chip tone={module.enabled ? "ok" : undefined}>
                                {module.enabled ? "Active" : "Disabled"}
                            </span>
                            {module.enabled
                                ? <button btn="ghost" type="button" onclick={() => simulateAction(`${module.name} settings are simulated.`)}>
                                    <i icon="gear" lib="solid" iconSize="sm"></i>
                                </button>
                                : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
