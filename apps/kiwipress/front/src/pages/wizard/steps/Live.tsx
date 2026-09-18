import { effect } from "@citrusworx/sigjs";
import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";
import { wizardData } from "../state";
import { REGION_LABELS, publicInstanceName, resolvedDomain, titleCase } from "../catalog";

export function Live() {
    let bodyNode: HTMLElement | null = null;

    function paint() {
        if (!bodyNode) return;
        const data = wizardData.get();
        const domain = resolvedDomain(data);
        const region = REGION_LABELS[data.region] ?? data.region;
        const name = publicInstanceName();
        const siteUrl = `https://${domain}`;

        bodyNode.replaceChildren(
            <div>
                <div live-hero>
                    <span pill="accent">
                        <span status-dot></span>
                        Deployment Successful
                    </span>
                    <h1>Your KiwiPress Instance is Live</h1>
                    <p lede>Production-ready WordPress stack deployed and accessible. Metrics below are simulated for this preview.</p>
                </div>

                <div live-body>
                    <div status-cards>
                        <div status-card>
                            <p subtle>Status</p>
                            <strong><span status-dot></span> LIVE</strong>
                        </div>
                        <div status-card>
                            <p subtle>Health</p>
                            <strong><span status-dot></span> Healthy</strong>
                        </div>
                        <div status-card>
                            <p subtle>Backups</p>
                            <strong><span status-dot></span> Active</strong>
                        </div>
                        <div status-card>
                            <p subtle>Last Backup</p>
                            <strong>2 hours ago</strong>
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
                                    <p>167.99.123.45</p>
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
                                <button type="button" onclick={() => window.open(siteUrl, "_blank", "noopener")}>
                                    <i icon="globe" lib="solid" iconSize="sm"></i>
                                    Open Site
                                </button>
                                <button btn="outline" type="button" onclick={() => window.open(`${siteUrl}/wp-admin`, "_blank", "noopener")}>
                                    <i icon="server" lib="solid" iconSize="sm"></i>
                                    WordPress Admin
                                </button>
                                <button btn="outline" type="button" onclick={() => window.open(`${siteUrl}/wp-json/`, "_blank", "noopener")}>
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
