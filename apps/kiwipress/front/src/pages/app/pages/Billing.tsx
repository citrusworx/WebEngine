import { effect } from "@citrusworx/sigjs";
import { DashboardLayout } from "../layout/DashboardLayout";
import { INVOICES, PLANS } from "../catalog";
import { actionNotice, currentPlan, simulateAction } from "../state";
import type { BillingPlan } from "../state";

export function Billing() {
    let bodyNode: HTMLElement | null = null;

    function paint() {
        if (!bodyNode) return;
        const planId = currentPlan.get();
        const plan = PLANS.find(item => item.id === planId) ?? PLANS[1];
        const notice = actionNotice.get();

        bodyNode.replaceChildren(
            <div dashboard-page>
                <header page-header>
                    <h1>Billing</h1>
                    <p lede>Current usage, invoices, and payment methods. Charges stay simulated.</p>
                </header>

                {notice ? <div notice>{notice}</div> : null}

                <div section-block>
                    <h2 section-kicker>Current Plan</h2>
                    <div panel-card>
                        <div header-row>
                            <div>
                                <div chip-row>
                                    <h3>{plan.name}</h3>
                                    <span chip tone="ok">Current Plan</span>
                                </div>
                                <p plan-price>
                                    ${plan.price}<span>/month</span>
                                </p>
                            </div>
                            <i icon="credit-card" lib="solid" iconSize="lg"></i>
                        </div>
                        <div detail-grid>
                            <div detail>
                                <span>Next Billing Date</span>
                                <p>March 1, 2026</p>
                            </div>
                            <div detail>
                                <span>Payment Method</span>
                                <p>•••• •••• •••• 4242</p>
                            </div>
                        </div>
                        <div action-group>
                            <button btn="outline" type="button" scale="sm" onclick={() => simulateAction("Payment method update is simulated.")}>
                                Update Payment Method
                            </button>
                            <button danger type="button" scale="sm" onclick={() => simulateAction("Cancellation is simulated. Pro plan remains active.")}>
                                Cancel Subscription
                            </button>
                        </div>
                    </div>
                </div>

                <div section-block>
                    <h2 section-kicker>Available Plans</h2>
                    <div plan-grid>
                        {PLANS.map(item => {
                            const current = item.id === planId;
                            return (
                                <div panel-card plan-card current={current || undefined}>
                                    <h3>{item.name}</h3>
                                    <p plan-price>
                                        ${item.price}<span>/month</span>
                                    </p>
                                    <ul spec-list>
                                        {item.features.map(feature => (
                                            <li>
                                                <i icon="check" lib="solid" iconSize="sm"></i>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    {current
                                        ? <button current type="button" full>Current Plan</button>
                                        : <button
                                            type="button"
                                            full
                                            onclick={() => {
                                                currentPlan.set(item.id as BillingPlan);
                                                simulateAction(`Switched to ${item.name}. Billing stays simulated.`);
                                            }}
                                        >
                                            {item.price > plan.price ? "Upgrade" : "Downgrade"}
                                        </button>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div section-block>
                    <h2 section-kicker>Invoices</h2>
                    <div data-table-wrap>
                        <table data-table>
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th end>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {INVOICES.map(invoice => (
                                    <tr>
                                        <td><span mono>{invoice.id}</span></td>
                                        <td>{invoice.date}</td>
                                        <td>{invoice.amount}</td>
                                        <td><span chip tone="ok">{invoice.status}</span></td>
                                        <td end>
                                            <button
                                                btn="ghost"
                                                type="button"
                                                aria-label={`Download ${invoice.id}`}
                                                onclick={() => simulateAction(`Download ${invoice.id} is simulated.`)}
                                            >
                                                <i icon="download" lib="solid" iconSize="sm"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div> as Node
        );
    }

    effect(() => {
        currentPlan.get();
        actionNotice.get();
        paint();
    });

    return (
        <DashboardLayout page="billing">
            <div ref={(node: HTMLElement) => { bodyNode = node; paint(); }}></div>
        </DashboardLayout>
    );
}
