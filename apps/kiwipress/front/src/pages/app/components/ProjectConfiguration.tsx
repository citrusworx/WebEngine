import { simulateAction } from "../state";

export function ProjectConfiguration() {
    return (
        <div section-block>
            <h2 section-kicker>Project Configuration</h2>
            <div panel-card>
                <div tile-grid="config">
                    <div tile>
                        <div tile-head>
                            <div row gap="cozy">
                                <div choice-icon tone="quiet">
                                    <i icon="code" lib="solid" iconSize="sm"></i>
                                </div>
                                <div>
                                    <h3>Configuration YAML</h3>
                                    <p subtle>View and manage your project configuration</p>
                                </div>
                            </div>
                        </div>
                        <div action-group>
                            <button btn="outline" type="button" scale="sm" onclick={() => simulateAction("YAML is shown below in Advanced mode.")}>
                                View YAML
                            </button>
                            <button btn="outline" type="button" scale="sm" onclick={() => simulateAction("YAML download is simulated.")}>
                                <i icon="download" lib="solid" iconSize="sm"></i>
                                Download
                            </button>
                            <button btn="outline" type="button" scale="sm" onclick={() => simulateAction("YAML editing is simulated.")}>
                                <i icon="gear" lib="solid" iconSize="sm"></i>
                                Edit
                            </button>
                        </div>
                    </div>
                    <div tile>
                        <div tile-head>
                            <div row gap="cozy">
                                <div choice-icon tone="quiet">
                                    <i icon="key" lib="solid" iconSize="sm"></i>
                                </div>
                                <div>
                                    <h3>Environment Variables</h3>
                                    <p subtle>Manage secrets and configuration values</p>
                                </div>
                            </div>
                        </div>
                        <div action-group>
                            <button btn="outline" type="button" scale="sm" onclick={() => simulateAction("Variable manager is simulated.")}>
                                Manage Variables
                            </button>
                            <span chip>12 variables</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
