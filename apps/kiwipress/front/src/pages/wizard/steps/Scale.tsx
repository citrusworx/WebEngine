import { Signal, effect } from "@citrusworx/sigjs";
import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";
import { wizardData } from "../state";
import { DROPLET_BASELINE, DROPLET_PRICING, REGION_LABELS, publicInstanceName, titleCase } from "../catalog";

type ScaleConfig = {
    ram: number;
    storage: number;
    cpu: number;
    addServer: boolean;
    loadBalancing: boolean;
};

export function Scale() {
    let bodyNode: HTMLElement | null = null;
    const config = Signal<ScaleConfig | null>(null);
    const applied = Signal(false);

    function ensureConfig(): ScaleConfig {
        const current = config.get();
        if (current) return current;
        const data = wizardData.get();
        const baseline = DROPLET_BASELINE[data.dropletSize];
        const next = {
            ram: data.customRAM ?? baseline.ram,
            storage: data.customStorage ?? baseline.storage,
            cpu: baseline.cpu,
            addServer: false,
            loadBalancing: data.loadBalancer
        };
        config.set(next);
        return next;
    }

    function patch(update: Partial<ScaleConfig>) {
        config.set({ ...ensureConfig(), ...update });
        applied.set(false);
    }

    function paint() {
        if (!bodyNode) return;
        const data = wizardData.get();
        const scale = ensureConfig();
        const baseline = DROPLET_BASELINE[data.dropletSize];
        const currentCost = DROPLET_PRICING[data.dropletSize] || 59;
        const ramCost = Math.max(0, (scale.ram - baseline.ram) * 5);
        const storageCost = Math.max(0, ((scale.storage - baseline.storage) / 50) * 10);
        const cpuCost = Math.max(0, (scale.cpu - baseline.cpu) * 15);
        const serverCost = scale.addServer ? currentCost : 0;
        const lbCost = scale.loadBalancing && !data.loadBalancer ? 35 : 0;
        const nextCost = currentCost + ramCost + storageCost + cpuCost + serverCost + lbCost;
        const region = REGION_LABELS[data.region] ?? data.region;

        bodyNode.replaceChildren(
            <div>
                <div panel-card>
                    <div header-row>
                        <div>
                            <h3>{publicInstanceName()}</h3>
                            <p subtle>{region} · Currently: {titleCase(data.dropletSize)}</p>
                        </div>
                        <span pill="accent"><span status-dot></span> LIVE</span>
                    </div>
                    <div detail-grid>
                        <div detail><span>CPU</span><p>{baseline.cpu} vCPU</p></div>
                        <div detail><span>RAM</span><p>{baseline.ram} GB</p></div>
                        <div detail><span>Storage</span><p>{baseline.storage} GB</p></div>
                    </div>
                </div>

                <div scale-card>
                    <div header-row>
                        <div row gap="cozy">
                            <div choice-icon><i icon="gauge" lib="solid" iconSize="sm"></i></div>
                            <div>
                                <h4>Adjust RAM</h4>
                                <p subtle>Scale memory allocation for better performance</p>
                            </div>
                        </div>
                        {ramCost > 0 ? <div choice-price><strong>+${ramCost}</strong><span>/month</span></div> : null}
                    </div>
                    <div range-field>
                        <div header-row>
                            <span subtle>Current: {baseline.ram} GB</span>
                            <span mono>{scale.ram} GB</span>
                        </div>
                        <input
                            type="range"
                            min={String(baseline.ram)}
                            max="32"
                            step="2"
                            value={String(scale.ram)}
                            onchange={(event: Event) => patch({ ram: Number((event.target as HTMLInputElement).value) })}
                        />
                    </div>
                </div>

                <div scale-card>
                    <div header-row>
                        <div row gap="cozy">
                            <div choice-icon><i icon="hard-drive" lib="solid" iconSize="sm"></i></div>
                            <div>
                                <h4>Add Storage</h4>
                                <p subtle>Increase disk space for content and backups</p>
                            </div>
                        </div>
                        {storageCost > 0 ? <div choice-price><strong>+${storageCost}</strong><span>/month</span></div> : null}
                    </div>
                    <div range-field>
                        <div header-row>
                            <span subtle>Current: {baseline.storage} GB</span>
                            <span mono>{scale.storage} GB</span>
                        </div>
                        <input
                            type="range"
                            min={String(baseline.storage)}
                            max="500"
                            step="50"
                            value={String(scale.storage)}
                            onchange={(event: Event) => patch({ storage: Number((event.target as HTMLInputElement).value) })}
                        />
                    </div>
                </div>

                <div scale-card>
                    <div header-row>
                        <div row gap="cozy">
                            <div choice-icon><i icon="server" lib="solid" iconSize="sm"></i></div>
                            <div>
                                <h4>Adjust CPU</h4>
                                <p subtle>Increase compute power for demanding workloads</p>
                            </div>
                        </div>
                        {cpuCost > 0 ? <div choice-price><strong>+${cpuCost}</strong><span>/month</span></div> : null}
                    </div>
                    <div cpu-grid>
                        {[baseline.cpu, 4, 8, 16].filter((value, index, list) => list.indexOf(value) === index).map(cpu => (
                            <button
                                type="button"
                                choice
                                selected={scale.cpu === cpu }
                                onclick={() => patch({ cpu })}
                            >
                                <strong>{cpu}</strong>
                                <span subtle>vCPU</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div scale-card>
                    <div switch-card>
                        <label>
                            <span>Add Server to Pool</span>
                            <input
                                type="checkbox"
                                checked={scale.addServer }
                                onchange={(event: Event) => patch({ addServer: (event.target as HTMLInputElement).checked })}
                            />
                        </label>
                        <p subtle>Deploy a second identical instance for horizontal scaling</p>
                        {scale.addServer ? <p>Additional cost: <strong>+${serverCost}/month</strong></p> : null}
                    </div>
                </div>

                <div scale-card>
                    <div switch-card>
                        <label>
                            <span>Enable Load Balancing</span>
                            <input
                                type="checkbox"
                                checked={scale.loadBalancing }
                                onchange={(event: Event) => patch({ loadBalancing: (event.target as HTMLInputElement).checked })}
                            />
                        </label>
                        <p subtle>Distribute traffic across multiple servers for high availability</p>
                        {lbCost > 0 ? <p>Additional cost: <strong>+${lbCost}/month</strong></p> : null}
                    </div>
                </div>

                <div cost-banner>
                    <div header-row>
                        <div>
                            <h3>Updated Monthly Cost</h3>
                            <p subtle>Current: ${currentCost}/month</p>
                        </div>
                        <div>
                            <strong>${nextCost}</strong>
                            {nextCost > currentCost ? <p subtle>+${nextCost - currentCost} increase</p> : null}
                        </div>
                    </div>
                    <ul spec-list>
                        <li><span dot></span>Changes are simulated in this preview</li>
                        <li><span dot></span>Zero downtime scaling with automatic migration</li>
                    </ul>
                    {applied.get() ? <p>Simulated scale request recorded. No live resize was sent.</p> : null}
                </div>

                <nav step-nav row gap="cozy">
                    <button btn="outline" type="button" onclick={() => router.navigate("/wizard/live")}>
                        <i icon="arrow-left" lib="solid" iconSize="sm"></i>
                        Cancel
                    </button>
                    <button type="button" onclick={() => applied.set(true)}>
                        Apply Changes
                        <i icon="arrow-right" lib="solid" iconSize="sm"></i>
                    </button>
                </nav>
            </div> as Node
        );
    }

    effect(() => {
        wizardData.get();
        config.get();
        applied.get();
        paint();
    });

    return (
        <WizardLayout step="scale">
            <div step-page="scale">
                <header step-header>
                    <h1>Scale Your Instance</h1>
                    <p lede>Adjust resources for your existing KiwiPress instance</p>
                </header>
                <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
            </div>
        </WizardLayout>
    );
}
