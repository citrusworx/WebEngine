import { defineConfig, loadEnv } from "vite";

const DEFAULT_BACKEND_URL = "http://localhost:8787";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const backendUrl = env.KIWIPRESS_API_URL?.trim() || DEFAULT_BACKEND_URL;

    return {
        server: {
            host: "0.0.0.0",
            port: 5173,
            proxy: {
                "/__kiwipress": {
                    target: backendUrl,
                    changeOrigin: true,
                    secure: false
                },
                "/wp-json": {
                    target: "https://wp.local.citrusworx.test",
                    changeOrigin: true,
                    secure: false
                }
            },
            allowedHosts: [
                "app.local.citrusworx.test",
                "frontend.kiwi.local",
                "localhost"
            ]
        }
    };
});
