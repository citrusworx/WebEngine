import { effect } from "@citrusworx/sigjs";
import { DashboardLayout } from "../layout/DashboardLayout";
import { accountDraft, actionNotice, simulateAction } from "../state";

export function Account() {
    let bodyNode: HTMLElement | null = null;

    function paint() {
        if (!bodyNode) return;
        const draft = accountDraft.get();
        const notice = actionNotice.get();

        bodyNode.replaceChildren(
            <div dashboard-page>
                <header page-header>
                    <h1>Account</h1>
                    <p lede>Your personal profile, sessions, and preferences. Updates stay local.</p>
                </header>

                {notice ? <div notice>{notice}</div> : null}

                <div section-block>
                    <h2 section-kicker>Profile Information</h2>
                    <div panel-card dash-form>
                        <div profile-row>
                            <div avatar>
                                <i icon="user" lib="solid" iconSize="lg"></i>
                            </div>
                            <div>
                                <h3>{draft.name || "John Doe"}</h3>
                                <p subtle>Member since Nov 2025</p>
                            </div>
                        </div>
                        <div field>
                            <span>Full Name</span>
                            <input
                                type="text"
                                value={draft.name}
                                onchange={(event: Event) => accountDraft.set({
                                    ...accountDraft.get(),
                                    name: (event.target as HTMLInputElement).value
                                })}
                            />
                        </div>
                        <div field>
                            <span>Email Address</span>
                            <input
                                type="email"
                                value={draft.email}
                                onchange={(event: Event) => accountDraft.set({
                                    ...accountDraft.get(),
                                    email: (event.target as HTMLInputElement).value
                                })}
                            />
                            <p subtle>Used for login and notifications</p>
                        </div>
                        <div field>
                            <span>Company (Optional)</span>
                            <input
                                type="text"
                                placeholder="Your company name"
                                value={draft.company}
                                onchange={(event: Event) => accountDraft.set({
                                    ...accountDraft.get(),
                                    company: (event.target as HTMLInputElement).value
                                })}
                            />
                        </div>
                        <button type="button" onclick={() => simulateAction("Profile update is simulated.")}>
                            Update Profile
                        </button>
                    </div>
                </div>

                <div section-block>
                    <h2 section-kicker>Security</h2>
                    <div panel-card>
                        <div switch-row>
                            <div>
                                <div chip-row>
                                    <i icon="key" lib="solid" iconSize="sm"></i>
                                    <h3>Password</h3>
                                </div>
                                <p subtle>Last changed 3 months ago</p>
                            </div>
                            <button btn="outline" type="button" scale="sm" onclick={() => simulateAction("Password change is simulated.")}>
                                Change Password
                            </button>
                        </div>
                        <div switch-row>
                            <div>
                                <h3>Two-Factor Authentication</h3>
                                <p subtle>Add an extra layer of security to your account</p>
                            </div>
                            <button type="button" scale="sm" onclick={() => simulateAction("2FA enrollment is simulated.")}>
                                Enable 2FA
                            </button>
                        </div>
                        <div switch-row>
                            <div>
                                <h3>API Keys</h3>
                                <p subtle>Manage API keys for programmatic access</p>
                            </div>
                            <button btn="outline" type="button" scale="sm" onclick={() => simulateAction("API key manager is simulated.")}>
                                Manage Keys
                            </button>
                        </div>
                    </div>
                </div>

                <div section-block>
                    <h2 section-kicker>Data Export</h2>
                    <div panel-card>
                        <div row gap="cozy">
                            <i icon="download" lib="solid" iconSize="sm"></i>
                            <div>
                                <h3>Export Project Configuration</h3>
                                <p subtle>
                                    Download your project configuration as a YAML file. This includes all settings, environment variables, and deployment configurations.
                                </p>
                                <button btn="outline" type="button" scale="sm" onclick={() => simulateAction("Project YAML export is simulated.")}>
                                    <i icon="download" lib="solid" iconSize="sm"></i>
                                    Export Project YAML
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div section-block>
                    <h2 section-kicker>Delete Account</h2>
                    <div danger-panel>
                        <div row gap="cozy">
                            <i icon="triangle-exclamation" lib="solid" iconSize="sm"></i>
                            <div>
                                <h3>Permanently Delete Account</h3>
                                <p>
                                    This will permanently delete your account, all projects, data, and cancel all subscriptions. This action cannot be undone.
                                </p>
                                <button type="button" onclick={() => simulateAction("Account deletion is simulated.")}>
                                    Delete My Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div> as Node
        );
    }

    effect(() => {
        accountDraft.get();
        actionNotice.get();
        paint();
    });

    return (
        <DashboardLayout page="account">
            <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
        </DashboardLayout>
    );
}
