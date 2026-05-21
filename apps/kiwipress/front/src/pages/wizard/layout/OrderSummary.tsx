import { effect } from "@citrusworx/sigjs";
import { wizardData } from "../state";
import type { WizardData } from "../state";

const DROPLET_PRICING: Record<WizardData["dropletSize"], number> = {
    starter: 29,
    growth: 59,
    scale: 119,
    pro: 249,
    enterprise: 0
};

const DATABASE_PRICING: Record<WizardData["databaseType"], number> = {
    shared: 0,
    dedicated: 25,
    "self-hosted": 0
};

const CDN_COST = 15;
const LOAD_BALANCER_COST = 35;

type LineItem = {
    icon: string;
    label: string;
    detail: string;
    cost: number;
};

function lineItemsFor(data: WizardData): LineItem[] {
    const items: LineItem[] = [];

    const dropletCost = DROPLET_PRICING[data.dropletSize];
    if (dropletCost > 0) {
        items.push({
            icon: "server",
            label: "Droplet",
            detail: `${data.dropletSize} · ${data.region}`,
            cost: dropletCost
        });
    }

    const dbCost = DATABASE_PRICING[data.databaseType];
    if (dbCost > 0) {
        items.push({
            icon: "database",
            label: "Database",
            detail: `${data.databaseType} Postgres`,
            cost: dbCost
        });
    }

    if (data.cdnEnabled) {
        items.push({ icon: "globe", label: "CDN", detail: "Global edge network", cost: CDN_COST });
    }

    if (data.loadBalancer) {
        items.push({ icon: "shield", label: "Load Balancer", detail: "High availability", cost: LOAD_BALANCER_COST });
    }

    return items;
}

export function OrderSummary() {
    let modeNode: HTMLElement | null = null;
    let itemsNode: HTMLElement | null = null;
    let totalNode: HTMLElement | null = null;

    effect(() => {
        const data = wizardData.get();
        if (!modeNode || !itemsNode || !totalNode) return;

        const items = lineItemsFor(data);
        const total = items.reduce((sum, item) => sum + item.cost, 0);

        modeNode.replaceChildren(
            <div mode-row>
                <i icon={data.deploymentMode === "performance" ? "rocket" : "layers"} lib="solid" iconSize="sm"></i>
                <div>
                    <p>{data.deploymentMode === "performance" ? "Performance Mode" : "Traditional Mode"}</p>
                    <p subtle>{data.deploymentMode === "performance" ? "KiwiPress Runtime + WordPress Backend" : "Standard WordPress Deployment"}</p>
                </div>
            </div> as Node
        );

        itemsNode.replaceChildren();
        if (items.length === 0) {
            itemsNode.appendChild(<p subtle>No paid line items yet. Configure your instance to see pricing.</p> as Node);
        } else {
            for (const item of items) {
                itemsNode.appendChild(
                    <div line-item>
                        <i icon={item.icon} lib="solid" iconSize="sm"></i>
                        <div line-body>
                            <p>{item.label}</p>
                            <p subtle>{item.detail}</p>
                        </div>
                        <span line-cost>${item.cost}</span>
                    </div> as Node
                );
            }
        }

        totalNode.textContent = `$${total}`;
    });

    return (
        <div order-summary>
            <header>
                <h3 eyebrow>Configuration Summary</h3>
                <p>Real-time cost &amp; settings</p>
            </header>

            <div summary-card>
                <div ref={(node: HTMLElement) => { modeNode = node; }} summary-mode></div>

                <div ref={(node: HTMLElement) => { itemsNode = node; }} summary-items></div>

                <div summary-total>
                    <span>Monthly Total</span>
                    <span ref={(node: HTMLElement) => { totalNode = node; }} total-amount>$0</span>
                </div>
                <p subtle>Billed monthly · Cancel anytime</p>

                <ul trust>
                    <li><span dot></span>You own the infrastructure</li>
                    <li><span dot></span>Modular architecture</li>
                    <li><span dot></span>Zero vendor lock-in</li>
                    <li><span dot></span>Open Core platform</li>
                </ul>
            </div>
        </div>
    );
}
