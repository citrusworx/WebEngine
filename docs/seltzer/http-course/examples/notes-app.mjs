import { randomUUID } from "node:crypto";
import { Seltzer } from "@citrusworx/seltzer";

// Application validation, not Seltzer's built-in presence validator.
export function readNoteText(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Body must be a JSON object" };
  }
  if (typeof body.text !== "string") {
    return { error: "text must be a string" };
  }
  const text = body.text.trim();
  if (text.length === 0 || text.length > 200) {
    return { error: "text must contain 1 to 200 characters after trimming" };
  }
  return { text };
}

// Returning a new app and Map per call isolates independent servers and tests.
export function createNotesApp({ makeId = randomUUID } = {}) {
  const notes = new Map();
  const app = Seltzer.init();

  app.route({
    method: "GET",
    path: "/health",
    handler: () => ({ body: { ok: true } }),
  });

  // Register the parametric route first to demonstrate specificity matching.
  app.route({
    method: "GET",
    path: "/notes/:id",
    handler: (ctx) => {
      const note = notes.get(ctx.params.id);
      return note
        ? { body: note }
        : { status: 404, body: { error: "Note not found" } };
    },
  });

  app.route({
    method: "GET",
    path: "/notes/stats",
    handler: () => ({ body: { count: notes.size } }),
  });

  app.route({
    method: "GET",
    path: "/notes",
    handler: (ctx) => {
      const q = (ctx.query.q ?? "").toLowerCase();
      return {
        body: [...notes.values()].filter((note) => note.text.toLowerCase().includes(q)),
      };
    },
  });

  function writeNote(ctx, creating) {
    const parsed = readNoteText(ctx.body);
    if (parsed.error) return { status: 400, body: { error: parsed.error } };

    if (!creating && !notes.has(ctx.params.id)) {
      return { status: 404, body: { error: "Note not found" } };
    }
    const id = creating ? makeId() : ctx.params.id;
    const note = { id, text: parsed.text };
    notes.set(id, note);
    return creating
      ? { status: 201, headers: { Location: `/notes/${encodeURIComponent(id)}` }, body: note }
      : { body: note };
  }

  app.route({
    method: "POST",
    path: "/notes",
    contract: { body: { text: "string.required" } },
    handler: (ctx) => writeNote(ctx, true),
  });

  app.route({
    method: "PATCH",
    path: "/notes/:id",
    contract: { body: { text: "string.required" } },
    handler: (ctx) => writeNote(ctx, false),
  });

  app.route({
    method: "DELETE",
    path: "/notes/:id",
    handler: (ctx) => notes.delete(ctx.params.id)
      ? { status: 204 }
      : { status: 404, body: { error: "Note not found" } },
  });

  return { app, notes };
}
