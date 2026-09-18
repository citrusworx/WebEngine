import { Signal, effect } from "@citrusworx/sigjs";
import { router } from "../../../router";
import { WizardLayout } from "../layout/WizardLayout";
import { wizardData } from "../state";
import {
    CDN_COST,
    DATABASE_PRICING,
    DROPLET_PRICING,
    LOAD_BALANCER_COST,
    REGION_LABELS,
    REPLICA_COST,
    monthlyTotal,
    titleCase
} from "../catalog";

export function Payment() {
    let bodyNode: HTMLElement | null = null;
    const processing = Signal(false);

    function back() {
        if (processing.get()) return;
        router.navigate("/wizard/domain");
    }

    function confirm() {
        if (processing.get()) return;
        processing.set(true);
        window.setTimeout(() => {
            router.navigate("/wizard/provisioning");
        }, 1500);
    }

    function paint() {
        if (!bodyNode) return;
        const data = wizardData.get();
        const busy = processing.get();
        const dropletCost = DROPLET_PRICING[data.dropletSize];
        const dbCost = DATABASE_PRICING[data.databaseType];
        const total = monthlyTotal(data);
        const region = REGION_LABELS[data.region] ?? data.region;

        bodyNode.replaceChildren(
            <div>
                <div pay-grid>
                    <div>
                        <h3 section-kicker>Order Summary</h3>
                        <div panel-card>
                            <div order-line>
                                <span subtle>Instance Configuration</span>
                                <div>
                                    <p>{titleCase(data.dropletSize)}</p>
                                    <p subtle>{region}</p>
                                </div>
                            </div>
                            <div order-lines>
                                <div order-line>
                                    <span>Droplet ({data.dropletSize})</span>
                                    <span mono>{data.dropletSize === "enterprise" ? "Custom" : `$${dropletCost}`}</span>
                                </div>
                                {dbCost > 0
                                    ? <div order-line>
                                        <span>Database ({data.databaseType})</span>
                                        <span mono>${dbCost}</span>
                                    </div>
                                    : null}
                                {data.cdnEnabled
                                    ? <div order-line>
                                        <span>CDN</span>
                                        <span mono>${CDN_COST}</span>
                                    </div>
                                    : null}
                                {data.loadBalancer
                                    ? <div order-line>
                                        <span>Load Balancer</span>
                                        <span mono>${LOAD_BALANCER_COST}</span>
                                    </div>
                                    : null}
                                {data.replicas > 0
                                    ? <div order-line>
                                        <span>Read Replicas ({data.replicas})</span>
                                        <span mono>${data.replicas * REPLICA_COST}</span>
                                    </div>
                                    : null}
                            </div>
                            <div summary-total>
                                <span>Monthly Total</span>
                                <span total-amount>${total}</span>
                            </div>
                            <ul trust>
                                <li><span dot></span>First month pro-rated</li>
                                <li><span dot></span>No additional provisioning fees</li>
                                <li><span dot></span>Cancel anytime, no long-term commitment</li>
                            </ul>
                        </div>

                        <div panel-card muted>
                            <h4>Post-Payment Status</h4>
                            <span pill="accent">PAID_PENDING_PROVISION</span>
                            <p subtle>Provisioning begins immediately after confirmation. Estimated deployment time: 3–5 minutes. This preview does not charge a card.</p>
                        </div>
                    </div>

                    <div>
                        <h3 section-kicker>Payment Method</h3>
                        <div panel-card pay-form>
                            <div field>
                                <span>Card Number</span>
                                <input type="text" name="card-number" placeholder="4242 4242 4242 4242" autocomplete="off" />
                            </div>
                            <div field-grid>
                                <div field>
                                    <span>Expiry Date</span>
                                    <input type="text" name="card-expiry" placeholder="MM / YY" autocomplete="off" />
                                </div>
                                <div field>
                                    <span>CVC</span>
                                    <input type="text" name="card-cvc" placeholder="123" autocomplete="off" />
                                </div>
                            </div>
                            <div field>
                                <span>Cardholder Name</span>
                                <input type="text" name="card-name" placeholder="Jane Doe" autocomplete="off" />
                            </div>
                            <div field>
                                <span>Billing Email</span>
                                <input type="email" name="card-email" placeholder="jane@example.com" autocomplete="off" />
                            </div>

                            <div secure-row>
                                <span><i icon="lock" lib="solid" iconSize="sm"></i> 256-bit SSL</span>
                                <span><i icon="shield" lib="solid" iconSize="sm"></i> PCI Compliant</span>
                            </div>

                            <button
                                full
                                type="button"
                                onclick={confirm}
                                disabled={busy}
                            >
                                {busy
                                    ? <span><i icon="circle-notch" lib="solid" iconSize="sm" spin></i> Processing…</span>
                                    : <span><i icon="lock" lib="solid" iconSize="sm"></i> Confirm &amp; Deploy</span>}
                            </button>
                            <p subtle>By confirming, you agree to our Terms of Service. This preview only simulates checkout — no payment is processed.</p>
                        </div>
                    </div>
                </div>

                <nav step-nav row gap="cozy">
                    <button btn="outline" type="button" onclick={back} disabled={busy}>
                        <i icon="arrow-left" lib="solid" iconSize="sm"></i>
                        Back
                    </button>
                    <p subtle>
                        <i icon="shield" lib="solid" iconSize="sm"></i>
                        Simulated checkout — no live processor
                    </p>
                </nav>
            </div> as Node
        );
    }

    effect(() => {
        wizardData.get();
        processing.get();
        paint();
    });

    return (
        <WizardLayout step="payment">
            <div step-page="payment">
                <header step-header>
                    <h1>Payment &amp; Confirmation</h1>
                    <p lede>Review your order and complete deployment</p>
                </header>
                <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
            </div>
        </WizardLayout>
    );
}
