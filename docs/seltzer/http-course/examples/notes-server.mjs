import { createNotesApp } from "./notes-app.mjs";

const { app } = createNotesApp();
const server = app.listen(3000, {
  cors: { origin: "http://127.0.0.1:4000" },
});

// This is host application code. Seltzer returns the Node server.
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  console.log("Stopping acceptance of new connections...");
  const deadline = setTimeout(() => {
    console.error("Shutdown deadline exceeded");
    process.exit(1);
  }, 5000);
  deadline.unref();
  server.close((error) => {
    clearTimeout(deadline);
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
