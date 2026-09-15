import { Signal, effect } from "@citrusworx/sigjs";
import { gatewayFetch } from "../../../api";

type CmsStatus = {
    mode?: string;
    entry?: string;
    destination?: string;
    native?: Record<string, number>;
    error?: string;
};

type TransferResult = {
    mode?: string;
    counts?: Record<string, number>;
    error?: string;
};

export function TransferPanel() {
    const cms = Signal<CmsStatus>({});
    const transfer = Signal<TransferResult>({});
    const status = Signal("Idle");
    let statusNode: HTMLElement | null = null;
    let summaryNode: HTMLElement | null = null;

    async function loadCms() {
        status.set("Loading CMS status...");
        try {
            const response = await gatewayFetch("/__kiwipress/cms");
            const payload = await response.json() as CmsStatus;
            if (!response.ok) {
                throw new Error(payload.error ?? "Unable to load CMS status.");
            }
            cms.set(payload);
            status.set(`Mode: ${payload.mode ?? "unknown"}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            cms.set({ error: message });
            status.set("CMS status failed.");
        }
    }

    async function runTransfer() {
        status.set("Transferring WordPress → Nectarine...");
        try {
            const response = await gatewayFetch("/__kiwipress/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ collections: ["posts", "pages", "users", "categories", "tags", "comments"] })
            });
            const payload = await response.json() as TransferResult;
            if (!response.ok) {
                throw new Error(payload.error ?? "Transfer failed.");
            }
            transfer.set(payload);
            await loadCms();
            status.set("Transferred. Reading from the Nectarine CMS now.");
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            transfer.set({ error: message });
            status.set("Transfer failed.");
        }
    }

    async function useWordpress() {
        await gatewayFetch("/__kiwipress/cms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "wordpress" })
        });
        await loadCms();
    }

    effect(() => {
        if (statusNode) {
            statusNode.textContent = status.get();
        }
    });

    effect(() => {
        if (!summaryNode) {
            return;
        }

        const current = cms.get();
        const counts = current.native ?? {};
        const transferError = transfer.get().error;
        const cmsError = current.error;

        summaryNode.replaceChildren(
            <div stack gap="0.75rem">
                {cmsError ? <p>{cmsError}</p> : null}
                {transferError ? <p>{transferError}</p> : null}
                <p>
                    Entry: {current.entry ?? "wordpress"} → destination: {current.destination ?? "nectarine"}
                </p>
                <ul>
                    {Object.entries(counts).map(([collection, count]) => (
                        <li>{collection}: {count}</li>
                    ))}
                </ul>
            </div>
        );
    });

    return (
        <div
            card
            card-padding="lg"
            ref={() => {
                void loadCms();
            }}
        >
            <div card-header stack gap="0.5rem">
                <p>WebEngine on-ramp</p>
                <h2>Transfer to Nectarine</h2>
                <p>
                    Start on WordPress Headless. Move posts, pages, users, and taxonomies into the native
                    Nectarine-shaped CMS KiwiPress carries into WebEngine.
                </p>
            </div>
            <div card-body stack gap="1rem">
                <div row wrap gap="0.5rem">
                    <button type="button" onclick={() => { void loadCms(); }}>Refresh status</button>
                    <button type="button" onclick={() => { void runTransfer(); }}>Transfer from WordPress</button>
                    <button btn="outline" type="button" onclick={() => { void useWordpress(); }}>Use WordPress</button>
                </div>
                <code ref={(node: HTMLElement) => { statusNode = node; }}>{status.get()}</code>
                <div ref={(node: HTMLElement) => { summaryNode = node; }} />
            </div>
        </div>
    );
}
