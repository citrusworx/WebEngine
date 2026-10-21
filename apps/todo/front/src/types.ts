export type Todo = {
  id: string;
  title: string;
  notes: string;
  done: boolean;
  created_at?: string;
};

/** What POST, PATCH, and DELETE return. Not the row, and not status 201. */
export type WriteAck = {
  ok: true;
  rowCount: number;
};

export type Sig<T> = { get(): T; set(value: T): void };
