import { ADAPTERS, COST_LINES, DEPLOYMENT_CONFIG } from "../catalog";
import { simulateAction } from "../state";

export function AdaptersPanel() {
    return (
        <>
            <div section-block>
                <div section-kicker>
                    <div>
                        Integrations &amp; Data Sources
                        <span>External services and platforms connected to your application</span>
                    </div>
                    <button btn="ghost" type="button" onclick={() => simulateAction("Add integration is simulated.")}>
                        Add Integration
                    </button>
                </div>
                <div tile-grid="adapters">
                    {ADAPTERS.map(adapter => (
                        <div tile>
                            <div tile-head>
                                <div row gap="cozy">
                                    <div choice-icon tone="info">
                                        <i icon="plug" lib="solid" iconSize="sm"></i>
                                    </div>
                                    <div>
                                        <h3>{adapter.name}</h3>
                                        <p subtle>{adapter.type}</p>
                                    </div>
                                </div>
                                <i icon="circle-check" lib="solid" iconSize="sm"></i>
                            </div>
                            <p subtle>{adapter.description}</p>
                            <div tile-head>
                                <div chip-row>
                                    <span chip tone="ok">Active</span>
                                    <span subtle>v{adapter.version}</span>
                                </div>
                                <button btn="ghost" type="button" onclick={() => simulateAction(`${adapter.name} settings are simulated.`)}>
                                    <i icon="gear" lib="solid" iconSize="sm"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div section-block>
                <h2 section-kicker>Deployment Configuration</h2>
                <div cost-split>
                    <div panel-card>
                        <div tile-grid="features">
                            {DEPLOYMENT_CONFIG.map(item => (
                                <div detail>
                                    <span>{item.label}</span>
                                    <p>{item.value}</p>
                                </div>
                            ))}
                        </div>
                        <div note tone="info">
                            <i icon="chart-line" lib="solid" iconSize="sm"></i>
                            <div>
                                <p><strong>Performance Insight</strong></p>
                                <p>Your SSR + Edge configuration provides optimal time-to-first-byte. Consider adding Redis cache warming for frequently accessed content.</p>
                            </div>
                        </div>
                    </div>
                    <div panel-card>
                        <div tile-head>
                            <div row gap="cozy">
                                <div choice-icon>
                                    <i icon="chart-line" lib="solid" iconSize="sm"></i>
                                </div>
                                <h3>Cost Estimate</h3>
                            </div>
                        </div>
                        <div order-lines>
                            {COST_LINES.map(line => (
                                <div order-line>
                                    <span subtle>{line.label}</span>
                                    <strong>{line.value}</strong>
                                </div>
                            ))}
                            <div order-line>
                                <strong>Est. Monthly</strong>
                                <strong>$42.50</strong>
                            </div>
                        </div>
                        <div note>
                            <i icon="circle-exclamation" lib="solid" iconSize="sm"></i>
                            <p>Based on current usage. May vary with traffic.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
