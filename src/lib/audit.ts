import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type LoginEvent = {
  email: string;
  ip?: string;
  ua?: string;        // user agent
  at: string;         // ISO timestamp
};

const STORE_NAME = "audit";
const KEY = "logins";
const LOCAL_DIR = ".netlify/blobs-local";
const MAX_EVENTS = 500;

function isMissingBlobsEnv(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("environment has not been configured to use Netlify Blobs");
}

async function localGet(): Promise<LoginEvent[]> {
  const path = join(LOCAL_DIR, STORE_NAME, `${KEY}.json`);
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as LoginEvent[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function localSet(data: LoginEvent[]): Promise<void> {
  const path = join(LOCAL_DIR, STORE_NAME, `${KEY}.json`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf8");
}

export async function listLogins(limit = 50): Promise<LoginEvent[]> {
  let events: LoginEvent[];
  try {
    const raw = await getStore(STORE_NAME).get(KEY, { type: "json" });
    events = (raw as LoginEvent[] | null) ?? [];
  } catch (err) {
    if (!isMissingBlobsEnv(err)) throw err;
    events = await localGet();
  }
  return [...events].reverse().slice(0, limit);
}

export async function recordLogin(event: Omit<LoginEvent, "at">): Promise<void> {
  let events: LoginEvent[];
  try {
    const raw = await getStore(STORE_NAME).get(KEY, { type: "json" });
    events = (raw as LoginEvent[] | null) ?? [];
  } catch (err) {
    if (!isMissingBlobsEnv(err)) throw err;
    events = await localGet();
  }
  const updated = [...events, { ...event, at: new Date().toISOString() }].slice(-MAX_EVENTS);
  try {
    await getStore(STORE_NAME).setJSON(KEY, updated);
  } catch (err) {
    if (!isMissingBlobsEnv(err)) throw err;
    await localSet(updated);
  }
}
