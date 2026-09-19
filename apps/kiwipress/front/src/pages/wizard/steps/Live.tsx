import { effect } from "@citrusworx/sigjs";
import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";
import { DestroyPanel } from "../DestroyPanel";
import { destroyError, destroyPhase, destroySummary } from "../destroy-flow";
import { liveInstance, wizardData } from "../state";
import { REGION_LABELS, publicInstanceName, resolvedDomain, titleCase } from "../catalog";

export function Live() {
    let bodyNode: HTMLElement | null = null;

    function paint() {
        if (!bodyNode) return;
        const data = wizardData.get();
        const live = liveInstance.get();
        const tornDown = Boolean(live?.destroyed);
        const domain = live?.domain || resolvedDomain(data);
        const ip = tornDown ? "Torn down" : live?.ip || "Pending";
        const region = REGION_LABELS[data.region] ?? data.region;
        const name = publicInstanceName();
        const siteUrl = domain.startsWith("http") ? domain : `https://${domain}`;

        bodyNode.replaceChildren(
            <div>
                <div live-hero>
                    <span pill={tornDown ? "warm" : "accent"}>
                        <span status-dot></span>
                        {tornDown ? "Stack destroyed" : "Deployment Successful"}
                    </span>
                    <h1>{tornDown ? "This KiwiPress stack is no longer live" : "Your KiwiPress Instance is Live"}</h1>
                    <p lede>
                        {tornDown
                            ? "DigitalOcean resources for this apply were torn down through GrapeVine. Local .grape/ssh keys are still on disk."
                            : "WordPress stack apply finished. The IP and domain below come from GrapeVine; the metrics cards stay simulated."}
                    </p>
                </div>

                <div live-body>
                    <div status-cards>
                        <div status-card>
                            <p subtle>Status</p>
                            <strong><span status-dot></span> {tornDown ? "DESTROYED" : "LIVE"}</strong>
                        </div>
                        <div status-card>
                            <p subtle>Health</p>
                            <strong><span status-dot></span> {tornDown ? "Offline" : "Healthy"}</strong>
                        </div>
                        <div status-card>
                            <p subtle>Backups</p>
                            <strong><span status-dot></span> {tornDown ? "Stopped" : "Active"}</strong>
                        </div>
                        <div status-card>
                            <p subtle>Last Backup</p>
                            <strong>{tornDown ? "—" : "2 hours ago"}</strong>
                        </div>
                    </div>

                    <div live-split>
                        <div panel-card>
                            <h3>Infrastructure Details</h3>
                            <div detail-grid>
                                <div detail>
                                    <span>Instance Name</span>
                                    <p>{name}</p>
                                </div>
                                <div detail>
                                    <span>Region</span>
                                    <p>{region} · {data.region.toUpperCase()}</p>
                                </div>
                                <div detail>
                                    <span>IP Address</span>
                                    <p>{ip}</p>
                                </div>
                                <div detail>
                                    <span>Domain</span>
                                    <p>{domain}</p>
                                </div>
                                <div detail>
                                    <span>Plan</span>
                                    <p>{titleCase(data.dropletSize)} · {titleCase(data.deploymentMode)}</p>
                                </div>
                                <div detail>
                                    <span>Avg Response Time</span>
                                    <p>124ms</p>
                                </div>
                            </div>
                            <div field>
                                <span>API Endpoint</span>
                                <span mono>{siteUrl}/wp-json/</span>
                            </div>
                        </div>

                        <div panel-card>
                            <h3>Quick Actions</h3>
                            <div action-stack>
                                <button
                                    type="button"
                                    disabled={tornDown || undefined}
                                    onclick={() => window.open(siteUrl, "_blank", "noopener")}
                                >
                                    <i icon="globe" lib="solid" iconSize="sm"></i>
                                    Open Site
                                </button>
                                <button
                                    btn="outline"
                                    type="button"
                                    disabled={tornDown || undefined}
                                    onclick={() => window.open(`${siteUrl}/wp-admin`, "_blank", "noopener")}
                                >
                                    <i icon="server" lib="solid" iconSize="sm"></i>
                                    WordPress Admin
                                </button>
                                <button
                                    btn="outline"
                                    type="button"
                                    disabled={tornDown || undefined}
                                    onclick={() => window.open(`${siteUrl}/wp-json/`, "_blank", "noopener")}
                                >
                                    <i icon="database" lib="solid" iconSize="sm"></i>
                                    View API Docs
                                </button>
                                <button type="button" onclick={() => router.navigate("/wizard/scale")}>
                                    <i icon="arrow-trend-up" lib="solid" iconSize="sm"></i>
                                    Scale Instance
                                </button>
                            </div>
                        </div>
                    </div>

                    <div panel-card>
                        <h3>Performance Metrics (24h)</h3>
                        <div metric-grid>
                            <div metric>
                                <p subtle>Total Requests</p>
                                <strong>12,847</strong>
                                <p subtle>↑ 12% vs yesterday</p>
                            </div>
                            <div metric>
                                <p subtle>Avg Response</p>
                                <strong>124ms</strong>
                                <p subtle>↓ 8ms faster</p>
                            </div>
                            <div metric>
                                <p subtle>Error Rate</p>
                                <strong>0.02%</strong>
                                <p subtle>Excellent</p>
                            </div>
                        </div>
                    </div>

                    <DestroyPanel />

                    <div panel-card muted>
                        <h4>Your Instance, Your Control</h4>
                        <ul spec-list>
                            <li><span dot></span>Full root access to your droplet</li>
                            <li><span dot></span>Automated daily backups</li>
                            <li><span dot></span>Zero vendor lock-in</li>
                            <li><span dot></span>Export data anytime</li>
                        </ul>
                    </div>
                </div>
            </div> as Node
        );
    }

    effect(() => {
        wizardData.get();
        liveInstance.get();
        destroyPhase.get();
        destroyError.get();
        destroySummary.get();
        paint();
    });

    return (
        <WizardLayout step="live">
            <div step-page="live">
                <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
            </div>
        </WizardLayout>
    );
}
