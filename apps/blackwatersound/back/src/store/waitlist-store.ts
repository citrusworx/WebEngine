import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { WaitlistEntry } from "../types/context.js";
import {
  getPool,
  insertWaitlistEntry,
  loadWaitlistFromDb,
  waitlistEmailExists,
} from "../db/postgres.js";

const defaultDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../data/runtime");
const dataDir = process.env.RUNTIME_DATA_DIR?.trim() || defaultDir;
const waitlistPath = path.join(dataDir, "waitlist.json");

function useDatabase() {
  return Boolean(getPool());
}

export async function loadWaitlist(): Promise<WaitlistEntry[]> {
  if (useDatabase()) {
    return loadWaitlistFromDb();
  }

  try {
    const raw = await readFile(waitlistPath, "utf8");
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

  await mkdir(dataDir, { recursive: true });
  await writeFile(waitlistPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
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

export async function hasWaitlistEmail(email: string) {
  if (useDatabase()) {
    return waitlistEmailExists(email);
  }

  const entries = await loadWaitlist();
  return entries.some((item) => item.email === email);
}
