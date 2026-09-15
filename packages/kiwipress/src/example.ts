import { Posts } from "./posts/posts.js";
import { KiwiPress } from "./cms/KiwiPress.js";
import { createFilePersistence } from "./cms/file-persistence.js";

async function runExample() {
    const posts = new Posts({
        url: "http://localhost:8080",
        apiBase: "wp-json/wp/v2"
    });
    const slug = `kiwipress-smoke-${Date.now()}`;

    console.log("KiwiPress create post smoke test starting...");

    const createdPost = await posts.create({
        title: "KiwiPress Smoke Test Post",
        content: "<p>This post was created through KiwiPress.</p>",
        status: "draft",
        slug
    });
    console.log("Created post:", createdPost);

    const postBySlug = await posts.getBySlug(slug);
    console.log("Post by slug:", postBySlug);

    const kiwi = KiwiPress.connect({
        url: "http://localhost:8080",
        apiBase: "wp-json/wp/v2",
        persistence: createFilePersistence("./data/kiwipress-cms.json")
    });
    const transfer = await kiwi.sync?.transfer(["posts"]);
    console.log("Transferred into Nectarine:", transfer?.counts);

    console.log("KiwiPress create post smoke test complete.");
}

runExample().catch((error) => {
    console.error("KiwiPress example failed:", error);
});
