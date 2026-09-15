import { Seltzer } from "@citrusworx/seltzer";
import { KiwiPress, registerKiwiPressGateway } from "@citrusworx/kiwipress";

const port = Number(process.env.KIWIPRESS_API_PORT ?? 8787);
const wordpressUrl = process.env.WP_URL?.trim();

const kiwi = wordpressUrl
    ? KiwiPress.connect({
        url: wordpressUrl,
        apiBase: process.env.WP_API?.trim() || "wp-json/wp/v2",
        username: process.env.WP_USER,
        appPassword: process.env.WP_APP_PASSWORD,
        token: process.env.WP_TOKEN,
        apiKey: process.env.WP_API_KEY
    })
    : KiwiPress.connect({
        mode: "nectarine"
    });

const server = Seltzer.init();
registerKiwiPressGateway(server, kiwi, {
    token: process.env.KIWIPRESS_GATEWAY_TOKEN?.trim() || undefined
});
server.listen(port);

console.log(
    `KiwiPress gateway listening on ${port} (${kiwi.mode}${wordpressUrl ? ` → ${wordpressUrl}` : ", native CMS only"})`
);
