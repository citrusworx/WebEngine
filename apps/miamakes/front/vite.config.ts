import { defineConfig, loadEnv } from "vite";

const DEFAULT_API = "http://localhost:3010";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.MIAMAKES_API_URL?.trim() || DEFAULT_API;

  return {
    server: {
      host: "0.0.0.0",
      port: 5174,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
        },
      },
    },
  };
});
