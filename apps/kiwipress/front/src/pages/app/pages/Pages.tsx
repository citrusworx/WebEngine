import { CollectionWorkspace } from "../collection/CollectionWorkspace";

export function Pages() {
    return (
        <CollectionWorkspace
            page="pages"
            kind="pages"
            title="Pages"
            singular="Page"
            lede="Create and edit pages against the same gateway collections as posts. Reuse this workspace later for custom types."
            emptyTitle="No pages yet"
            emptyBody="Create a page here. It is saved through /__kiwipress/content/pages — nothing is simulated."
        />
    );
}
