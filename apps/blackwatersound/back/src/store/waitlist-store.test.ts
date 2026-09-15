import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { WaitlistEntry } from "../types/context.js";
import {
  appendWaitlistEntry,
  findWaitlistByEmail,
  hasWaitlistEmail,
  loadWaitlist,
} from "./waitlist-store.js";

const previousRuntimeDir = process.env.RUNTIME_DATA_DIR;
let runtimeDir: string | undefined;

beforeEach(async () => {
  runtimeDir = await mkdtemp(path.join(os.tmpdir(), "blackwater-waitlist-store-"));
  process.env.RUNTIME_DATA_DIR = runtimeDir;
});

afterEach(async () => {
  if (previousRuntimeDir === undefined) {
    delete process.env.RUNTIME_DATA_DIR;
  } else {
    process.env.RUNTIME_DATA_DIR = previousRuntimeDir;
  }

  if (runtimeDir) {
    await rm(runtimeDir, { recursive: true, force: true });
    runtimeDir = undefined;
  }
});

const entry: WaitlistEntry = {
  id: "wl_1",
  name: "Ada",
  email: "ada@example.com",
  sourceApp: "www",
  interest: "gear",
  createdAt: "2026-09-15T00:00:00.000Z",
};

describe("waitlist file-store fallback", () => {
  it("appends to waitlist.json and looks up by email when Postgres is unset", async () => {
    expect(await loadWaitlist()).toEqual([]);
    expect(await hasWaitlistEmail(entry.email)).toBe(false);

    await appendWaitlistEntry(entry);

    expect(await loadWaitlist()).toEqual([entry]);
    expect(await findWaitlistByEmail("ada@example.com")).toEqual(entry);
    expect(await hasWaitlistEmail("ada@example.com")).toBe(true);
    expect(await findWaitlistByEmail("other@example.com")).toBeNull();

    const raw = await readFile(path.join(runtimeDir!, "waitlist.json"), "utf8");
    expect(JSON.parse(raw)).toEqual([entry]);
  });
});
