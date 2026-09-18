import { effect } from "@citrusworx/sigjs";
import { wizardData } from "../state";
import type { WizardData } from "../state";
import {
    CDN_COST,
    DATABASE_PRICING,
    DROPLET_PRICING,
    LOAD_BALANCER_COST,
    REPLICA_COST,
    REGION_LABELS,
    modeLabel,
    monthlyTotal,
    titleCase
} from "../catalog";

type LineItem = {
    icon: string;
    label: string;
    detail: string;
    cost: number | "custom";
};

function lineItemsFor(data: WizardData): LineItem[] {
    const items: LineItem[] = [];
    const region = REGION_LABELS[data.region] ?? data.region;
    const dropletCost = DROPLET_PRICING[data.dropletSize];

    items.push({
        icon: "server",
        label: "Droplet",
        detail: `${titleCase(data.dropletSize)} · ${region}`,
        cost: data.dropletSize === "enterprise" ? "custom" : dropletCost
    });

    const dbCost = DATABASE_PRICING[data.databaseType];
    if (dbCost > 0) {
        items.push({
            icon: "database",
            label: "Database",
            detail: `${titleCase(data.databaseType)} Postgres`,
            cost: dbCost
        });
    }

    if (data.cdnEnabled) {
        items.push({ icon: "globe", label: "CDN", detail: "Global edge network", cost: CDN_COST });
    }

    if (data.loadBalancer) {
        items.push({ icon: "shield", label: "Load Balancer", detail: "High availability", cost: LOAD_BALANCER_COST });
    }

    if (data.replicas > 0) {
        items.push({
            icon: "database",
            label: "Read Replicas",
            detail: `${data.replicas} replica${data.replicas === 1 ? "" : "s"}`,
            cost: data.replicas * REPLICA_COST
        });
    }

    return items;
}

export function OrderSummary() {
    let modeNode: HTMLElement | null = null;
    let itemsNode: HTMLElement | null = null;
    let totalNode: HTMLElement | null = null;

    function paint() {
        const data = wizardData.get();
        if (!modeNode || !itemsNode || !totalNode) return;

        const items = lineItemsFor(data);
        const total = monthlyTotal(data);
        const mode = modeLabel(data.deploymentMode);
        const showProfile = data.deploymentMode === "performance" && !data.advancedMode;

        modeNode.replaceChildren(
            <div mode-row>
                <i icon={data.deploymentMode === "performance" ? "rocket" : "layer-group"} lib="solid" iconSize="sm"></i>
                <div>
                    <p>{mode.title}</p>
                    <p subtle>{mode.detail}</p>
                    {showProfile
                        ? <span profile-chip>Profile: {titleCase(data.experienceProfile)}</span>
                        : null}
                </div>
            </div> as Node
        );

        itemsNode.replaceChildren();
        for (const item of items) {
            itemsNode.appendChild(
                <div line-item>
                    <i icon={item.icon} lib="solid" iconSize="sm"></i>
                    <div line-body>
                        <p>{item.label}</p>
                        <p subtle>{item.detail}</p>
                    </div>
                    <span line-cost>{item.cost === "custom" ? "Custom" : `$${item.cost}`}</span>
                </div> as Node
            );
        }

        totalNode.textContent = `$${total}`;
    }

    effect(() => {
        wizardData.get();
        paint();
    });

    return (
        <div order-summary>
            <header>
                <h3 eyebrow>Configuration Summary</h3>
                <p>Real-time cost &amp; settings</p>
            </header>

            <div summary-card>
                <div ref={(node: HTMLElement) => { modeNode = node; paint(); }} summary-mode></div>

                <div ref={(node: HTMLElement) => { itemsNode = node; paint(); }} summary-items></div>

                <div summary-total>
                    <span>Monthly Total</span>
                    <span ref={(node: HTMLElement) => { totalNode = node; paint(); }} total-amount>$0</span>
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
