import { Seltzer, generateRoutes, response } from "@citrusworx/seltzer";

const notes = new Map([["intro", { id: "intro", text: "Read an operation description" }]]);
const operations = [
  { resource: "note", crud: "read", name: "allNotes", method: "GET", path: "/notes", query: "allNotes" },
  { resource: "note", crud: "read", name: "noteById", method: "GET", path: "/notes/:id", query: "noteById" },
  { resource: "note", crud: "read", name: "noteCount", method: "GET", path: "/notes/stats", query: "noteCount" },
];

export function createGeneratedApp() {
  const app = Seltzer.init();
  for (const route of generateRoutes(operations, {
    execute: ({ query, params }) => {
      if (query === "allNotes") return [...notes.values()];
      if (query === "noteById") return notes.get(params.id) ?? null;
      if (query === "noteCount") {
        return response({ headers: { "X-Example": "generated" }, body: { count: notes.size } });
      }
      throw new Error(`Unknown operation: ${query}`);
    },
  })) app.route(route);
  return app;
}
