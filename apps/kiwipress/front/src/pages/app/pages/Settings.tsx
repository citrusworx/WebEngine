import { effect } from "@citrusworx/sigjs";
import { DashboardLayout } from "../layout/DashboardLayout";
import { actionNotice, settingsDraft, simulateAction } from "../state";

export function Settings() {
    let bodyNode: HTMLElement | null = null;

    function paint() {
        if (!bodyNode) return;
        const draft = settingsDraft.get();
        const notice = actionNotice.get();

        bodyNode.replaceChildren(
            <div dashboard-page>
                <header page-header>
                    <h1>Settings</h1>
                    <p lede>Application defaults, notifications, and destructive actions. Changes stay local.</p>
                </header>

                {notice ? <div notice>{notice}</div> : null}

                <div section-block>
                    <h2 section-kicker>Application Settings</h2>
                    <div panel-card dash-form>
                        <div field>
                            <span>Application Name</span>
                            <input
                                type="text"
                                value={draft.appName}
                                onchange={(event: Event) => settingsDraft.set({
                                    ...settingsDraft.get(),
                                    appName: (event.target as HTMLInputElement).value
                                })}
                            />
                        </div>
                        <div field>
                            <span>Domain</span>
                            <input
                                type="text"
                                value={draft.domain}
                                onchange={(event: Event) => settingsDraft.set({
                                    ...settingsDraft.get(),
                                    domain: (event.target as HTMLInputElement).value
                                })}
                            />
                            <p subtle>Custom domains can be configured in DNS settings</p>
                        </div>
                        <div field>
                            <span>Environment</span>
                            <select
                                onchange={(event: Event) => settingsDraft.set({
                                    ...settingsDraft.get(),
                                    environment: (event.target as HTMLSelectElement).value
                                })}
                            >
                                <option value="production" selected={draft.environment === "production"}>Production</option>
                                <option value="staging" selected={draft.environment === "staging"}>Staging</option>
                                <option value="development" selected={draft.environment === "development"}>Development</option>
                            </select>
                        </div>
                        <div switch-row>
                            <div>
                                <p>Auto-deploy on push</p>
                                <p subtle>Automatically deploy when code is pushed to main branch</p>
                            </div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={draft.autoDeploy}
                                    onchange={(event: Event) => settingsDraft.set({
                                        ...settingsDraft.get(),
                                        autoDeploy: (event.target as HTMLInputElement).checked
                                    })}
                                />
                            </label>
                        </div>
                        <div switch-row>
                            <div>
                                <p>Automatic SSL</p>
                                <p subtle>Automatically provision and renew SSL certificates</p>
                            </div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={draft.autoSsl}
                                    onchange={(event: Event) => settingsDraft.set({
                                        ...settingsDraft.get(),
                                        autoSsl: (event.target as HTMLInputElement).checked
                                    })}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div section-block>
                    <h2 section-kicker>Notifications</h2>
                    <div panel-card>
                        <div switch-row>
                            <div>
                                <p>Deployment notifications</p>
                                <p subtle>Get notified when deployments complete</p>
                            </div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={draft.notifyDeploy}
                                    onchange={(event: Event) => settingsDraft.set({
                                        ...settingsDraft.get(),
                                        notifyDeploy: (event.target as HTMLInputElement).checked
                                    })}
                                />
                            </label>
                        </div>
                        <div switch-row>
                            <div>
                                <p>System alerts</p>
                                <p subtle>Alerts for high resource usage or downtime</p>
                            </div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={draft.notifySystem}
                                    onchange={(event: Event) => settingsDraft.set({
                                        ...settingsDraft.get(),
                                        notifySystem: (event.target as HTMLInputElement).checked
                                    })}
                                />
                            </label>
                        </div>
                        <div switch-row>
                            <div>
                                <p>Billing notifications</p>
                                <p subtle>Monthly invoices and payment reminders</p>
                            </div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={draft.notifyBilling}
                                    onchange={(event: Event) => settingsDraft.set({
                                        ...settingsDraft.get(),
                                        notifyBilling: (event.target as HTMLInputElement).checked
                                    })}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div section-block>
                    <h2 section-kicker>Danger Zone</h2>
                    <div danger-panel>
                        <div row gap="cozy">
                            <i icon="triangle-exclamation" lib="solid" iconSize="sm"></i>
                            <div>
                                <h3>Delete Application</h3>
                                <p>Once you delete this application, there is no going back. All data, deployments, and backups will be permanently deleted.</p>
                                <button type="button" onclick={() => simulateAction("Delete application is simulated.")}>
                                    Delete Application
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div save-row>
                    <button type="button" onclick={() => simulateAction("Settings saved locally. Nothing was sent to infra.")}>
                        <i icon="floppy-disk" lib="solid" iconSize="sm"></i>
                        Save Changes
                    </button>
                </div>
            </div> as Node
        );
    }

    effect(() => {
        settingsDraft.get();
        actionNotice.get();
        paint();
    });

    return (
        <DashboardLayout page="settings">
            <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
        </DashboardLayout>
    );
}
