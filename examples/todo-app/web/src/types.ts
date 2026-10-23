export type Todo = {
  id: number;
  title: string;
  notes: string;
  done: boolean;
  created_at?: string;
};

/**
 * What PATCH and DELETE return. INSERT uses `returning`, so POST is a row.
 * Status stays 200 unless the host returns `response(...)`.
 */
export type WriteAck = {
  ok: true;
  rowCount: number;
};

export type Sig<T> = { get(): T; set(value: T): void };
