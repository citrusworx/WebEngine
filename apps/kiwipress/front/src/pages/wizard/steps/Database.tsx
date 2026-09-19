import { effect } from "@citrusworx/sigjs";
import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";
import { updateWizard, wizardData } from "../state";
import type { DatabaseType } from "../state";
import { BACKUP_OPTIONS } from "../catalog";

export function Database() {
    let bodyNode: HTMLElement | null = null;

    function next() { router.navigate("/wizard/domain"); }
    function back() { router.navigate("/wizard/configure"); }

    function paint() {
        if (!bodyNode) return;
        const data = wizardData.get();

        bodyNode.replaceChildren(
            <div>
                <div section-block>
                    <h3 section-kicker>
                        Managed Database
                        <span>PostgreSQL options</span>
                    </h3>
                    <div stack gap="cozy">
                        <button
                            type="button"
                            choice
                            selected={data.databaseType === "shared" }
                            onclick={() => updateWizard({ databaseType: "shared" as DatabaseType })}
                        >
                            <div choice-head>
                                <div row gap="cozy">
                                    <div choice-icon><i icon="database" lib="solid" iconSize="sm"></i></div>
                                    <div>
                                        <h4>Shared Managed Postgres</h4>
                                        <p>High-performance shared cluster. Perfect for most deployments.</p>
                                        <span pill="accent">Included</span>
                                    </div>
                                </div>
                                <strong>$0</strong>
                            </div>
                        </button>

                        <button
                            type="button"
                            choice
                            selected={data.databaseType === "dedicated" }
                            onclick={() => updateWizard({ databaseType: "dedicated" as DatabaseType })}
                        >
                            <div choice-head>
                                <div row gap="cozy">
                                    <div choice-icon><i icon="shield" lib="solid" iconSize="sm"></i></div>
                                    <div>
                                        <h4>Dedicated Managed Postgres</h4>
                                        <p>Isolated database instance. Enhanced performance and control.</p>
                                        <span pill="accent">Recommended for Scale+</span>
                                    </div>
                                </div>
                                <div choice-price>
                                    <strong>+$25</strong>
                                    <span>/month</span>
                                </div>
                            </div>
                        </button>

                        {data.advancedMode
                            ? <button
                                type="button"
                                choice
                                selected={data.databaseType === "self-hosted" }
                                onclick={() => updateWizard({ databaseType: "self-hosted" as DatabaseType })}
                            >
                                <div choice-head>
                                    <div row gap="cozy">
                                        <div choice-icon><i icon="database" lib="solid" iconSize="sm"></i></div>
                                        <div>
                                            <h4>Self-Hosted Container DB</h4>
                                            <p>Run Postgres in a Docker container on your droplet.</p>
                                            <p subtle>Advanced only · Manual backups required</p>
                                        </div>
                                    </div>
                                    <strong>$0</strong>
                                </div>
                            </button>
                            : null}
                    </div>
                </div>

                <div panel-card>
                    <h3 section-kicker>
                        Backup Configuration
                        <span>Automated backup settings</span>
                    </h3>
                    <div field-grid>
                        <div field>
                            <span>Backup Frequency</span>
                            <select
                                onchange={(event: Event) => updateWizard({
                                    backupFrequency: (event.target as HTMLSelectElement).value
                                })}
                            >
                                {BACKUP_OPTIONS.map(option => (
                                    <option value={option.value} selected={data.backupFrequency === option.value }>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div field>
                            <span>Retention Policy (Days)</span>
                            <input
                                type="number"
                                min="1"
                                max="90"
                                value={String(data.retentionPolicy)}
                                onchange={(event: Event) => updateWizard({
                                    retentionPolicy: Number((event.target as HTMLInputElement).value)
                                })}
                            />
                        </div>
                    </div>
                    <div note>
                        <i icon="shield" lib="solid" iconSize="sm"></i>
                        <div>
                            <p><strong>Encryption &amp; Security</strong></p>
                            <p>All backups are encrypted at rest using AES-256 encryption. Data is stored in geographically distributed locations for redundancy.</p>
                        </div>
                    </div>
                </div>

                {data.advancedMode
                    ? <div panel-card muted>
                        <h3 section-kicker>Advanced Options</h3>
                        <div switch-card>
                            <label>
                                <span>Connection Pooling</span>
                                <input
                                    type="checkbox"
                                    checked={data.connectionPooling }
                                    onchange={(event: Event) => updateWizard({
                                        connectionPooling: (event.target as HTMLInputElement).checked
                                    })}
                                />
                            </label>
                            <p subtle>Enable PgBouncer for efficient connection management</p>
                        </div>
                        <div field>
                            <span>Read Replicas</span>
                            <select
                                onchange={(event: Event) => updateWizard({
                                    replicas: Number((event.target as HTMLSelectElement).value)
                                })}
                            >
                                <option value="0" selected={data.replicas === 0 }>None</option>
                                <option value="1" selected={data.replicas === 1 }>1 Replica (+$15/mo)</option>
                                <option value="2" selected={data.replicas === 2 }>2 Replicas (+$30/mo)</option>
                                <option value="3" selected={data.replicas === 3 }>3 Replicas (+$45/mo)</option>
                            </select>
                        </div>
                    </div>
                    : null}

                <nav step-nav row gap="cozy">
                    <button btn="outline" type="button" onclick={back}>
                        <i icon="arrow-left" lib="solid" iconSize="sm"></i>
                        Back
                    </button>
                    <button type="button" onclick={next}>
                        Continue
                        <i icon="arrow-right" lib="solid" iconSize="sm"></i>
                    </button>
                </nav>
            </div> as Node
        );
    }

    effect(() => {
        wizardData.get();
        paint();
    });

    return (
        <WizardLayout step="database">
            <div step-page="database">
                <header step-header>
                    <h1>Database Configuration</h1>
                    <p lede>Choose your managed database setup</p>
                </header>
                <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
            </div>
        </WizardLayout>
    );
}
