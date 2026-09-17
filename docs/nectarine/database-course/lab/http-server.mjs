import { Seltzer } from "@citrusworx/seltzer";
import { openLab, runNamed } from "./runtime.mjs";

const db = await openLab();
const app = Seltzer.init();
app.route({ method: "GET", path: "/items", handler: async () => ({
  body: (await runNamed(db, "item", "get", "AllItems")).rows,
}) });
app.route({ method: "GET", path: "/items/:id", handler: async (ctx) => {
  if (!/^[1-9][0-9]*$/.test(ctx.params.id)) return { status: 400, body: { error: "ID must be a positive integer" } };
  const id = Number(ctx.params.id);
  if (!Number.isSafeInteger(id) || id > 2147483647) return { status: 400, body: { error: "ID outside integer range" } };
  const { rows } = await runNamed(db, "item", "get", "ById", [id]);
  return rows.length ? { body: rows[0] } : { status: 404, body: { error: "Item not found" } };
} });
const server = app.listen(3001);
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => process.exit(1), 5000);
  deadline.unref();
  server.close(async (error) => {
    try { await db.close(); if (error) throw error; }
    catch (failure) { console.error(failure); process.exitCode = 1; }
    finally { clearTimeout(deadline); }
  });
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
