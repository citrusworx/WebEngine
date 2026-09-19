import { CollectionWorkspace } from "../collection/CollectionWorkspace";

export function Pages() {
    return (
        <CollectionWorkspace
            page="pages"
            kind="pages"
            title="Pages"
            singular="Page"
            lede="Create and edit pages against the same gateway collections as posts. Custom types reuse this workspace at /app/c/:slug."
            emptyTitle="No pages yet"
            emptyBody="Create a page here. It is saved through /__kiwipress/content/pages — nothing is simulated."
        />
    );
}
