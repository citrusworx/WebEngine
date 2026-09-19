import path from "node:path";
import { Seltzer } from "@citrusworx/seltzer";
import {
    KiwiPress,
    createFilePersistence,
    persistenceFromEnv,
    registerKiwiPressGateway
} from "@citrusworx/kiwipress";
import { registerKiwiPressProvision } from "./provision/register.js";

function resolvePersistence() {
    return persistenceFromEnv() ?? createFilePersistence(
        path.join(process.cwd(), "data", "kiwipress-cms.json")
    );
}

async function main() {
    const port = Number(process.env.KIWIPRESS_API_PORT ?? 8787);
    const wordpressUrl = process.env.WP_URL?.trim();
    const persistence = resolvePersistence();

    const kiwi = wordpressUrl
        ? KiwiPress.connect({
            url: wordpressUrl,
            apiBase: process.env.WP_API?.trim() || "wp-json/wp/v2",
            username: process.env.WP_USER,
            appPassword: process.env.WP_APP_PASSWORD,
            token: process.env.WP_TOKEN,
            apiKey: process.env.WP_API_KEY,
            persistence
        })
        : KiwiPress.connect({
            mode: "nectarine",
            persistence
        });

    await kiwi.ready();

    const server = Seltzer.init();
    const gatewayAuth = {
        token: process.env.KIWIPRESS_GATEWAY_TOKEN?.trim() || undefined
    };
    registerKiwiPressGateway(server, kiwi, gatewayAuth);
    registerKiwiPressProvision(server, gatewayAuth);
    server.listen(port);

    console.log(
        `KiwiPress gateway listening on ${port} (${kiwi.mode}${wordpressUrl ? ` → ${wordpressUrl}` : ", native CMS only"}; persistence=${kiwi.store.persistenceKind})`
    );
}

main().catch((error) => {
    console.error("KiwiPress gateway failed to start:", error);
    process.exit(1);
});
