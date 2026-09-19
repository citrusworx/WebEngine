import type { RouteParams } from "@citrusworx/sigjs";
import { Signal, effect } from "@citrusworx/sigjs";
import { CollectionWorkspace } from "../collection/CollectionWorkspace";
import { DashboardLayout } from "../layout/DashboardLayout";
import { getType } from "../types/api";
import type { TypeDefinition } from "../types/model";

export function TypeCollection(params: RouteParams) {
    const slug = typeof params.slug === "string" ? params.slug : "";
    const definition = Signal<TypeDefinition | null>(null);
    const error = Signal("");
    const loading = Signal(true);
    let bodyNode: HTMLElement | null = null;
    let requested = false;

    function paint() {
        if (!bodyNode) {
            return;
        }

        const current = definition.get();
        if (loading.get() && !current) {
            bodyNode.replaceChildren(
                <DashboardLayout page={`c:${slug}`}>
                    <div dashboard-page>
                        <header page-header>
                            <h1>{slug || "Type"}</h1>
                            <p lede>Loading the collection definition…</p>
                        </header>
                    </div>
                </DashboardLayout> as Node
            );
            return;
        }

        if (!current) {
            bodyNode.replaceChildren(
                <DashboardLayout page="types">
                    <div dashboard-page>
                        <header page-header>
                            <h1>Type not found</h1>
                            <p lede>{error.get() || `No custom type is registered as ${slug}.`}</p>
                        </header>
                        <div panel-card dashed>
                            <h3>Register this type first</h3>
                            <p subtle>Open Types to add a slug, labels, and statuses, then come back to edit items.</p>
                            <a href="/app/types">
                                <button type="button">Go to Types</button>
                            </a>
                        </div>
                    </div>
                </DashboardLayout> as Node
            );
            return;
        }

        bodyNode.replaceChildren(
            <CollectionWorkspace
                page={`c:${current.slug}`}
                kind={current.slug}
                title={current.label}
                singular={current.singular}
                statuses={current.statuses}
                lede={`Native ${current.singular.toLowerCase()} items for the ${current.slug} collection. Saved through /__kiwipress/content/${current.slug}.`}
                emptyTitle={`No ${current.label.toLowerCase()} yet`}
                emptyBody={`Create a ${current.singular.toLowerCase()} here. It is saved through the gateway — nothing is simulated.`}
            /> as Node
        );
    }

    async function load() {
        if (!slug) {
            loading.set(false);
            error.set("Missing type slug.");
            return;
        }

        loading.set(true);
        try {
            definition.set(await getType(slug));
            error.set("");
        } catch (caught) {
            definition.set(null);
            error.set(caught instanceof Error ? caught.message : String(caught));
        } finally {
            loading.set(false);
        }
    }

    effect(() => {
        definition.get();
        error.get();
        loading.get();
        paint();
    });

    return (
        <div
            ref={(node: HTMLElement) => {
                bodyNode = node;
                paint();
                if (!requested) {
                    requested = true;
                    void load();
                }
            }}
        />
    );
}
