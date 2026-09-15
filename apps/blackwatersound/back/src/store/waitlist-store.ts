import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WaitlistEntry } from "../types/context.js";
import {
  insertWaitlistEntry,
  isDatabaseConnected,
  loadWaitlistByEmailFromDb,
  loadWaitlistFromDb,
  waitlistEmailExists,
} from "../db/postgres.js";

const defaultDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../data/runtime");

function waitlistPath() {
  const dataDir = process.env.RUNTIME_DATA_DIR?.trim() || defaultDir;
  return path.join(dataDir, "waitlist.json");
}

function useDatabase() {
  return isDatabaseConnected();
}

export async function loadWaitlist(): Promise<WaitlistEntry[]> {
  if (useDatabase()) {
    return loadWaitlistFromDb();
  }

  try {
    const raw = await readFile(waitlistPath(), "utf8");
    const parsed = JSON.parse(raw) as WaitlistEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveWaitlist(entries: WaitlistEntry[]) {
  if (useDatabase()) {
    return;
  }

  const file = waitlistPath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

export async function appendWaitlistEntry(entry: WaitlistEntry) {
  if (useDatabase()) {
    await insertWaitlistEntry(entry);
    return;
  }

  const entries = await loadWaitlist();
  entries.push(entry);
  await saveWaitlist(entries);
}

export async function findWaitlistByEmail(email: string): Promise<WaitlistEntry | null> {
  if (useDatabase()) {
    return loadWaitlistByEmailFromDb(email);
  }

  const entries = await loadWaitlist();
  return entries.find((item) => item.email === email) ?? null;
}

export async function hasWaitlistEmail(email: string) {
  if (useDatabase()) {
    return waitlistEmailExists(email);
  }

  return Boolean(await findWaitlistByEmail(email));
}
