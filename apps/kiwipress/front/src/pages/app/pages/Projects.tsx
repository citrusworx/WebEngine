import { effect } from "@citrusworx/sigjs";
import { DashboardLayout } from "../layout/DashboardLayout";
import { FEATURES, INSTANCE, METRICS, USAGE } from "../catalog";
import { AdaptersPanel } from "../components/AdaptersPanel";
import { BackupSection } from "../components/BackupSection";
import { DeploymentTable } from "../components/DeploymentTable";
import { MetricCard } from "../components/MetricCard";
import { ModeToggle } from "../components/ModeToggle";
import { ModulesPanel } from "../components/ModulesPanel";
import { ProjectConfiguration } from "../components/ProjectConfiguration";
import { YAMLViewer } from "../components/YAMLViewer";
import { DestroyPanel } from "../../wizard/DestroyPanel";
import { beginDestroyConfirm, destroyError, destroyPhase, destroySummary } from "../../wizard/destroy-flow";
import { liveInstance } from "../../wizard/state";
import { backupsEnabled, instanceStatus, simulateAction, viewMode, yamlHistoryOpen } from "../state";

function statusLabel(): string {
    if (liveInstance.get()?.destroyed || destroyPhase.get() === "done") {
        return "Destroyed";
    }
    const status = instanceStatus.get();
    if (status === "restarting") return "Restarting";
    if (status === "rebuilding") return "Rebuilding";
    return "Running";
}

export function Projects() {
    let bodyNode: HTMLElement | null = null;

    function paint() {
        if (!bodyNode) return;
        const mode = viewMode.get();
        const status = instanceStatus.get();
        const tornDown = Boolean(liveInstance.get()?.destroyed) || destroyPhase.get() === "done";
        const phase = destroyPhase.get();

        bodyNode.replaceChildren(
            <div dashboard-page>
                <div header-row>
                    <div>
                        <h1 instance-title>{INSTANCE.name}</h1>
                        <div chip-row>
                            <span status-chip tone={tornDown ? "warm" : "ok"}>
                                <span status-dot pulse={!tornDown && status === "running" || undefined}></span>
                                {statusLabel()}
                            </span>
                            <span status-chip>
                                <i icon="location-dot" lib="solid" iconSize="sm"></i>
                                {INSTANCE.region}
                            </span>
                            <span status-chip>
                                <i icon="server" lib="solid" iconSize="sm"></i>
                                {INSTANCE.size}
                            </span>
                        </div>
                    </div>
                    <div instance-actions>
                        <ModeToggle />
                        <div action-group>
                            <button
                                btn="outline"
                                type="button"
                                scale="sm"
                                onclick={() => simulateAction("Restarting instance…", "restarting")}
                            >
                                <i icon="rotate" lib="solid" iconSize="sm"></i>
                                Restart
                            </button>
                            <button
                                btn="outline"
                                type="button"
                                scale="sm"
                                onclick={() => simulateAction("Rebuilding instance…", "rebuilding")}
                            >
                                <i icon="arrows-rotate" lib="solid" iconSize="sm"></i>
                                Rebuild
                            </button>
                            <button
                                btn="outline"
                                type="button"
                                scale="sm"
                                onclick={() => simulateAction("Log stream is simulated.")}
                            >
                                <i icon="file-lines" lib="solid" iconSize="sm"></i>
                                View Logs
                            </button>
                            <span divider></span>
                            <button
                                danger
                                type="button"
                                scale="sm"
                                disabled={phase === "running" || undefined}
                                onclick={beginDestroyConfirm}
                            >
                                <i icon="trash" lib="solid" iconSize="sm"></i>
                                Destroy
                            </button>
                        </div>
                    </div>
                </div>

                <div health-grid>
                    <div panel-card tone="ok">
                        <div tile-head>
                            <div row gap="cozy">
                                <div choice-icon>
                                    <i icon="bolt" lib="solid" iconSize="sm"></i>
                                </div>
                                <div>
                                    <p subtle>Application Health</p>
                                    <strong>{INSTANCE.health}</strong>
                                </div>
                            </div>
                        </div>
                        <div health-meta>
                            <span>
                                <i icon="wave-square" lib="solid" iconSize="sm"></i>
                                {INSTANCE.uptime} uptime
                            </span>
                            <span>
                                <i icon="clock" lib="solid" iconSize="sm"></i>
                                {INSTANCE.response}
                            </span>
                        </div>
                    </div>
                    <div panel-card>
                        <div detail-grid>
                            <div detail>
                                <span>Domain</span>
                                <a href={`https://${INSTANCE.domain}`}>{INSTANCE.domain}</a>
                            </div>
                            <div detail>
                                <span>SSL Certificate</span>
                                <p>Active · Expires {INSTANCE.sslExpires}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {mode === "simple"
                    ? <div section-block>
                        <h2 section-kicker>Active Features</h2>
                        <div tile-grid="features">
                            {FEATURES.map(feature => (
                                <div tile>
                                    <div tile-head>
                                        <div choice-icon>
                                            <i icon={feature.icon} lib="solid" iconSize="sm"></i>
                                        </div>
                                        <i icon="circle-check" lib="solid" iconSize="sm"></i>
                                    </div>
                                    <strong>{feature.label}</strong>
                                    <p subtle>{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    : null}

                {mode === "advanced"
                    ? <>
                        <ModulesPanel />
                        <AdaptersPanel />
                    </>
                    : null}

                <div section-block>
                    <h2 section-kicker>
                        {mode === "simple" ? "Infrastructure Summary" : "Infrastructure Control Plane"}
                    </h2>
                    <div metric-grid>
                        {METRICS.map(metric => (
                            <MetricCard
                                icon={metric.icon}
                                label={metric.label}
                                value={metric.value}
                                subtitle={metric.subtitle}
                            />
                        ))}
                    </div>
                    <div usage-grid>
                        {USAGE.map(item => (
                            <div panel-card usage>
                                <div usage-head>
                                    <span>
                                        <i icon={item.icon} lib="solid" iconSize="sm"></i>
                                        {item.label}
                                    </span>
                                    {mode === "advanced" ? <span mono>{item.percent.toFixed(1)}%</span> : null}
                                </div>
                                <div usage-bar>
                                    <span
                                        usage-fill
                                        tone={item.tone}
                                        ref={(node: HTMLElement) => { node.style.width = `${item.percent}%`; }}
                                    ></span>
                                </div>
                                <div usage-meta>
                                    <span>{item.used}</span>
                                    <span>{item.total}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {phase !== "idle" || tornDown
                    ? <div section-block>
                        <h2 section-kicker>Danger Zone</h2>
                        <DestroyPanel compact showIdleButton={false} />
                    </div>
                    : null}

                <DeploymentTable />
                <BackupSection />

                {mode === "advanced"
                    ? <>
                        <ProjectConfiguration />
                        <YAMLViewer />
                    </>
                    : null}
            </div> as Node
        );
    }

    effect(() => {
        viewMode.get();
        instanceStatus.get();
        yamlHistoryOpen.get();
        backupsEnabled.get();
        liveInstance.get();
        destroyPhase.get();
        destroyError.get();
        destroySummary.get();
        paint();
    });

    return (
        <DashboardLayout page="projects">
            <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
        </DashboardLayout>
    );
}
