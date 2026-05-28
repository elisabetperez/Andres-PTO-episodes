import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type ReactionsForDate = Record<string, string[]>; // emoji → emails

const STORE_NAME = "reactions";
const LOCAL_DIR = ".netlify/blobs-local";

export const ALLOWED_EMOJI = ["👍", "❤️", "😂", "🔥", "🎉", "🤯", "👀", "🫡"] as const;
export type AllowedEmoji = (typeof ALLOWED_EMOJI)[number];

function isMissingBlobsEnv(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("environment has not been configured to use Netlify Blobs");
}

async function localGet(date: string): Promise<ReactionsForDate> {
  const path = join(LOCAL_DIR, STORE_NAME, `${date}.json`);
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as ReactionsForDate;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw err;
  }
}

async function localSet(date: string, data: ReactionsForDate): Promise<void> {
  const path = join(LOCAL_DIR, STORE_NAME, `${date}.json`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf8");
}

export async function getReactions(date: string): Promise<ReactionsForDate> {
  try {
    const raw = await getStore(STORE_NAME).get(date, { type: "json" });
    return (raw as ReactionsForDate | null) ?? {};
  } catch (err) {
    if (isMissingBlobsEnv(err)) return localGet(date);
    throw err;
  }
}

async function persist(date: string, data: ReactionsForDate): Promise<void> {
  try {
    await getStore(STORE_NAME).setJSON(date, data);
  } catch (err) {
    if (!isMissingBlobsEnv(err)) throw err;
    await localSet(date, data);
  }
}

export async function toggleReaction(
  date: string,
  emoji: string,
  email: string
): Promise<ReactionsForDate> {
  const current = await getReactions(date);
  const list = current[emoji] ?? [];
  const idx = list.indexOf(email);
  if (idx >= 0) {
    list.splice(idx, 1);
    if (list.length === 0) delete current[emoji];
    else current[emoji] = list;
  } else {
    current[emoji] = [...list, email];
  }
  await persist(date, current);
  return current;
}
