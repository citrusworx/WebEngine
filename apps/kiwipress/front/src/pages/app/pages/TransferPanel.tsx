import { Signal, effect } from "@citrusworx/sigjs";
import { gatewayFetch } from "../../../api";

type CmsStatus = {
    mode?: string;
    entry?: string;
    destination?: string;
    persistence?: string;
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
    let requested = false;

    function paintStatus() {
        if (statusNode) {
            statusNode.textContent = status.get();
        }
    }

    function paintSummary() {
        if (!summaryNode) {
            return;
        }

        const current = cms.get();
        const counts = current.native ?? {};
        const transferError = transfer.get().error;
        const cmsError = current.error;
        const entries = Object.entries(counts);

        summaryNode.replaceChildren(
            <div stack gap="0.75rem">
                {cmsError ? <div note><i icon="circle-exclamation" lib="solid" iconSize="sm"></i><p>{cmsError}</p></div> : null}
                {transferError ? <div note><i icon="circle-exclamation" lib="solid" iconSize="sm"></i><p>{transferError}</p></div> : null}
                <div detail-grid>
                    <div detail>
                        <span>Mode</span>
                        <p>{current.mode ?? "unknown"}</p>
                    </div>
                    <div detail>
                        <span>Path</span>
                        <p>{current.entry ?? "wordpress"} → {current.destination ?? "nectarine"}</p>
                    </div>
                    <div detail>
                        <span>Persistence</span>
                        <p>{current.persistence ?? "memory"}</p>
                    </div>
                </div>
                {entries.length
                    ? <div chip-wrap>
                        {entries.map(([collection, count]) => (
                            <span chip>{collection}: {count}</span>
                        ))}
                    </div>
                    : <p subtle>No native collection counts yet.</p>}
            </div> as Node
        );
    }

    async function loadCms() {
        status.set("Loading CMS status…");
        paintStatus();
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
        paintStatus();
        paintSummary();
    }

    async function runTransfer() {
        status.set("Transferring WordPress → Nectarine…");
        paintStatus();
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
        paintStatus();
        paintSummary();
    }

    async function useWordpress() {
        await gatewayFetch("/__kiwipress/cms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "wordpress" })
        });
        await loadCms();
    }

    function bindPanel() {
        if (requested || !statusNode || !summaryNode) {
            return;
        }

        requested = true;
        void loadCms();
    }

    effect(() => {
        status.get();
        paintStatus();
    });

    effect(() => {
        cms.get();
        transfer.get();
        paintSummary();
    });

    return (
        <div panel-card>
            <div tile-head>
                <div>
                    <h3>Transfer to Nectarine</h3>
                    <p subtle>
                        Start on WordPress Headless when a URL is configured. Move posts, pages, users, and taxonomies into the native CMS this library persists.
                    </p>
                </div>
            </div>
            <div action-group>
                <button btn="outline" type="button" scale="sm" onclick={() => { void loadCms(); }}>
                    Refresh status
                </button>
                <button type="button" scale="sm" onclick={() => { void runTransfer(); }}>
                    Transfer from WordPress
                </button>
                <button btn="outline" type="button" scale="sm" onclick={() => { void useWordpress(); }}>
                    Use WordPress
                </button>
            </div>
            <p subtle ref={(node: HTMLElement) => {
                statusNode = node;
                paintStatus();
                bindPanel();
            }}>{status.get()}</p>
            <div ref={(node: HTMLElement) => {
                summaryNode = node;
                paintSummary();
                bindPanel();
            }} />
        </div>
    );
}
