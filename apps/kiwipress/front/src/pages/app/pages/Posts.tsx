import { CollectionWorkspace } from "../collection/CollectionWorkspace";

export function Posts() {
    return (
        <CollectionWorkspace
            page="posts"
            kind="posts"
            title="Posts"
            singular="Post"
            lede="Write, publish, and revise posts stored by the KiwiPress gateway. Native Nectarine CMS first; WordPress when the API is connected."
            emptyTitle="No posts yet"
            emptyBody="Create a post here. It is saved through /__kiwipress/content/posts — nothing is simulated."
        />
    );
}
