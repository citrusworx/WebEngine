import { createApp } from "./app";
import router from "./routes";
import { env } from "./env";

const app = createApp();

app.use("/api", router);

const port = Number(env.PORT ?? 4000);

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});
