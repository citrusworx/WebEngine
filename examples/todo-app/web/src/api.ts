import type { Todo, WriteAck } from "./types";

/** Dev is same-origin through the Vite proxy. Production sets VITE_API_BASE. */
export function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE;
  if (typeof raw !== "string") {
    return "";
  }
  return raw.replace(/\/$/, "");
}

function messageFrom(body: unknown, status: number): string {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) {
      return error;
    }
  }
  return `Request failed (${status})`;
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) {
    return null;
  }
  return JSON.parse(text) as unknown;
}

function asTodo(value: unknown): Todo {
  if (!value || typeof value !== "object") {
    throw new Error("Todo row was not an object");
  }
  const row = value as Record<string, unknown>;
  const id = typeof row.id === "number" ? row.id : Number.NaN;
  if (!Number.isInteger(id) || typeof row.title !== "string") {
    throw new Error("Todo row is missing id or title");
  }
  return {
    id,
    title: row.title,
    notes: typeof row.notes === "string" ? row.notes : "",
    done: row.done === true,
    created_at: typeof row.created_at === "string" ? row.created_at : undefined,
  };
}

function asWriteAck(value: unknown): WriteAck {
  if (!value || typeof value !== "object") {
    throw new Error("Write did not return { ok: true, rowCount }");
  }
  const body = value as { ok?: unknown; rowCount?: unknown };
  if (body.ok !== true || typeof body.rowCount !== "number") {
    throw new Error("Write did not return { ok: true, rowCount }");
  }
  return { ok: true, rowCount: body.rowCount };
}

export async function listTodos(): Promise<Todo[]> {
  const res = await fetch(`${apiBase()}/api/todos`);
  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(messageFrom(body, res.status));
  }
  if (!Array.isArray(body)) {
    throw new Error("Expected a list of todos");
  }
  return body.map(asTodo);
}

/**
 * The database picks the id (SERIAL). The insert lists title, notes, and done.
 * `returning: '*'` puts the saved row in the response. Status is 200.
 */
export async function createTodo(input: {
  title: string;
  notes: string;
  done: boolean;
}): Promise<Todo> {
  const res = await fetch(`${apiBase()}/api/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      notes: input.notes,
      done: input.done,
    }),
  });
  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(messageFrom(body, res.status));
  }
  return asTodo(body);
}

/** PATCH binds every update column. Send the whole todo, not a diff. */
export function todoPatch(todo: Todo) {
  return {
    title: todo.title,
    notes: todo.notes,
    done: todo.done,
  };
}

export async function updateTodo(todo: Todo): Promise<WriteAck> {
  const res = await fetch(`${apiBase()}/api/todos/${encodeURIComponent(String(todo.id))}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(todoPatch(todo)),
  });
  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(messageFrom(body, res.status));
  }
  return asWriteAck(body);
}

export async function deleteTodo(id: number): Promise<WriteAck> {
  const res = await fetch(`${apiBase()}/api/todos/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(messageFrom(body, res.status));
  }
  return asWriteAck(body);
}
