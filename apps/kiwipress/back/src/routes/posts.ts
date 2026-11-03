import { Posts } from "@citrusworx/kiwipress";

export const posts = new Posts({
    url: "http://localhost:8080",
    apiBase: "wp-json/wp/v2"
});

