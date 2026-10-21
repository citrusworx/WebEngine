import {
    bridgeBusy,
    bridgeConfirm,
    bridgeDraft,
    bridgeError,
    bridgePhase,
    bridgeProbe,
    bridgeStatus,
    bridgeStep,
    continueToFrontend,
    refreshBridgeStatus,
    submitPair,
    submitProbe,
    submitUnpair
} from "./state";
import type { BridgeConnectionStatus } from "./api";

function statusCopy(status: BridgeConnectionStatus): string {
    if (status === "connected") return "Connected";
    if (status === "needs_attention") return "Needs attention";
    return "Disconnected";
}

function statusTone(status: BridgeConnectionStatus): "ok" | "warm" | undefined {
    if (status === "connected") return "ok";
    if (status === "needs_attention") return "warm";
    return undefined;
}

function fieldValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
}

function statusCard() {
    const status = bridgeStatus.get();
    if (!status) return null;
    const busy = bridgeBusy.get();
    const confirming = bridgeConfirm.get();
    const paired = status.status !== "disconnected";

    return (
        <div panel-card tone={status.status === "connected" ? "ok" : undefined}>
            <div tile-head>
                <div row gap="cozy">
                    <div choice-icon>
                        <i icon="wordpress" lib="brands" iconSize="sm"></i>
                    </div>
                    <div>
                        <p subtle>WordPress</p>
                        <strong>{statusCopy(status.status)}</strong>
                    </div>
                </div>
                <span status-chip tone={statusTone(status.status)}>
                    <span status-dot tone={status.status === "needs_attention" ? "warn" : undefined} pulse={status.status === "connected" || undefined}></span>
                    {statusCopy(status.status)}
                </span>
            </div>

            {status.reasons.length > 0
                ? <ul spec-list>
                    {status.reasons.map((reason) => (
                        <li><span dot></span>{reason}</li>
                    ))}
                </ul>
                : <p subtle>The bridge plugin, pairing flag, and frontend URL all check out.</p>}

            {paired
                ? <div detail-grid>
                    <div detail>
                        <span>Site</span>
                        <p>{status.siteUrl}</p>
                    </div>
                    <div detail>
                        <span>Account</span>
                        <p>{status.username}</p>
                    </div>
                    <div detail>
                        <span>Frontend</span>
                        <p>{status.frontendUrl}</p>
                    </div>
                    <div detail>
                        <span>Plugin</span>
                        <p>{status.pluginVersion ?? "Unknown"}{status.lockdown === true ? " · lockdown on" : status.lockdown === false ? " · lockdown off" : ""}</p>
                    </div>
                </div>
                : null}

            {bridgeError.get() && bridgePhase.get() === "status"
                ? <div note>{bridgeError.get()}</div>
                : null}

            {confirming
                ? <div note>
                    Disconnect this WordPress site? KiwiPress will ask the plugin to mark itself unpaired, then delete the stored application password from this project.
                </div>
                : null}

            <div action-group>
                <button
                    btn="outline"
                    type="button"
                    scale="sm"
                    disabled={busy || undefined}
                    onclick={() => { void refreshBridgeStatus(); }}
                >
                    <i icon="rotate" lib="solid" iconSize="sm"></i>
                    Check again
                </button>
                {paired && !confirming
                    ? <button
                        danger
                        type="button"
                        scale="sm"
                        disabled={busy || undefined}
                        onclick={() => bridgeConfirm.set(true)}
                    >
                        <i icon="link-slash" lib="solid" iconSize="sm"></i>
                        Disconnect
                    </button>
                    : null}
                {confirming
                    ? <>
                        <button
                            btn="outline"
                            type="button"
                            scale="sm"
                            disabled={busy || undefined}
                            onclick={() => bridgeConfirm.set(false)}
                        >
                            Cancel
                        </button>
                        <button
                            danger
                            type="button"
                            scale="sm"
                            disabled={busy || undefined}
                            onclick={() => { void submitUnpair(); }}
                        >
                            Disconnect
                        </button>
                    </>
                    : null}
            </div>
        </div>
    );
}

function connectForm() {
    const step = bridgeStep.get();
    const busy = bridgeBusy.get();
    const probe = bridgeProbe.get();
    const found = probe && probe.pluginPresent ? probe : null;

    return (
        <div panel-card dash-form>
            <div chip-row>
                <span status-chip tone={step === 1 ? "ok" : undefined}>1 · Site</span>
                <span status-chip tone={step === 2 ? "ok" : undefined}>2 · Account</span>
                <span status-chip tone={step === 3 ? "ok" : undefined}>3 · Frontend</span>
            </div>

            {found
                ? <p subtle>
                    {found.siteUrl} · plugin {found.pluginVersion} · WordPress {found.wpVersion}
                    {found.lockdown ? " · lockdown on" : " · lockdown off"}
                    {found.paired ? " · plugin already paired" : ""}
                </p>
                : null}

            {step === 1
                ? <div field>
                    <span>WordPress site URL</span>
                    <input
                        type="url"
                        name="wp-site-url"
                        placeholder="https://cms.example.com"
                        value={bridgeDraft.siteUrl}
                        oninput={(event: Event) => { bridgeDraft.siteUrl = fieldValue(event); }}
                    />
                    <p subtle>KiwiPress calls the public health route. WordPress does not need to know where this app lives yet.</p>
                </div>
                : null}

            {step === 2
                ? <>
                    <div field>
                        <span>Username</span>
                        <input
                            type="text"
                            name="wp-username"
                            autocomplete="off"
                            value={bridgeDraft.username}
                            oninput={(event: Event) => { bridgeDraft.username = fieldValue(event); }}
                        />
                    </div>
                    <div field>
                        <span>Application password</span>
                        <input
                            type="password"
                            name="wp-application-password"
                            autocomplete="new-password"
                            value={bridgeDraft.applicationPassword}
                            oninput={(event: Event) => { bridgeDraft.applicationPassword = fieldValue(event); }}
                        />
                        <p subtle>WordPress creates these under Users → Profile → Application Passwords. Use an administrator. KiwiPress encrypts the password and does not send it back to the browser.</p>
                    </div>
                </>
                : null}

            {step === 3
                ? <div field>
                    <span>Frontend URL</span>
                    <input
                        type="url"
                        name="frontend-url"
                        placeholder="https://app.example.com"
                        value={bridgeDraft.frontendUrl}
                        oninput={(event: Event) => { bridgeDraft.frontendUrl = fieldValue(event); }}
                    />
                    <p subtle>While lockdown is on, logged-out visitors to the WordPress theme are redirected here.</p>
                </div>
                : null}

            {bridgeError.get()
                ? <div note>{bridgeError.get()}</div>
                : null}
            {probe && !probe.pluginPresent && probe.code === "plugin_missing"
                ? <p subtle>In WordPress, open Plugins and activate KiwiPress Bridge, then probe again.</p>
                : null}

            <div action-group>
                {step > 1
                    ? <button
                        btn="outline"
                        type="button"
                        scale="sm"
                        disabled={busy || undefined}
                        onclick={() => {
                            bridgeError.set("");
                            bridgeStep.set((step - 1) as 1 | 2);
                        }}
                    >
                        Back
                    </button>
                    : null}
                {step === 1
                    ? <button type="button" scale="sm" disabled={busy || undefined} onclick={() => { void submitProbe(); }}>
                        Probe
                    </button>
                    : null}
                {step === 2
                    ? <button type="button" scale="sm" disabled={busy || undefined} onclick={() => continueToFrontend()}>
                        Continue
                    </button>
                    : null}
                {step === 3
                    ? <button type="button" scale="sm" disabled={busy || undefined} onclick={() => { void submitPair(); }}>
                        Pair
                    </button>
                    : null}
            </div>
        </div>
    );
}

export function WordPressBridge() {
    const phase = bridgePhase.get();

    return (
        <div section-block>
            <h2 section-kicker>
                WordPress
                <span>Pair this project with a site running the KiwiPress Bridge plugin</span>
            </h2>
            <div bridge-stack>
                {phase === "loading"
                    ? <div panel-card muted>
                        <p subtle>Checking the WordPress connection…</p>
                    </div>
                    : null}
                {phase === "error"
                    ? <div panel-card>
                        <div note>{bridgeError.get() || "Could not load the WordPress connection."}</div>
                        <div action-group>
                            <button
                                btn="outline"
                                type="button"
                                scale="sm"
                                disabled={bridgeBusy.get() || undefined}
                                onclick={() => { void refreshBridgeStatus(); }}
                            >
                                Check again
                            </button>
                        </div>
                    </div>
                    : null}
                {phase === "form" || phase === "status" ? statusCard() : null}
                {phase === "form" ? connectForm() : null}
            </div>
        </div>
    );
}
