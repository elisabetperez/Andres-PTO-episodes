import { getStore } from "@netlify/blobs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type Episode = {
  date: string;        // YYYY-MM-DD
  title: string;
  summary: string;
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
};

const STORE_NAME = "episodes";
const LOCAL_DIR = ".netlify/blobs-local";

function isMissingBlobsEnv(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("environment has not been configured to use Netlify Blobs");
}

async function localGet(date: string): Promise<Episode | null> {
  const path = join(LOCAL_DIR, STORE_NAME, `${date}.json`);
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as Episode;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function localList(): Promise<Episode[]> {
  const dir = join(LOCAL_DIR, STORE_NAME);
  let files: string[] = [];
  try {
    files = await readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  const items = await Promise.all(
    files.filter((f) => f.endsWith(".json")).map(async (f) => {
      const raw = await readFile(join(dir, f), "utf8");
      return JSON.parse(raw) as Episode;
    })
  );
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

async function localSet(date: string, ep: Episode): Promise<void> {
  const path = join(LOCAL_DIR, STORE_NAME, `${date}.json`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(ep, null, 2), "utf8");
}

export async function getEpisode(date: string): Promise<Episode | null> {
  try {
    const raw = await getStore(STORE_NAME).get(date, { type: "json" });
    return (raw as Episode | null) ?? null;
  } catch (err) {
    if (isMissingBlobsEnv(err)) return localGet(date);
    throw err;
  }
}

export async function listEpisodes(): Promise<Episode[]> {
  try {
    const store = getStore(STORE_NAME);
    const { blobs } = await store.list();
    const items = await Promise.all(
      blobs.map((b) => store.get(b.key, { type: "json" }) as Promise<Episode | null>)
    );
    return items.filter((x): x is Episode => x !== null).sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    if (isMissingBlobsEnv(err)) return localList();
    throw err;
  }
}

export async function putEpisode(input: {
  date: string;
  title: string;
  summary: string;
}): Promise<Episode> {
  const now = new Date().toISOString();
  const existing = await getEpisode(input.date);
  const ep: Episode = {
    date: input.date,
    title: input.title.trim(),
    summary: input.summary.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  try {
    await getStore(STORE_NAME).setJSON(input.date, ep);
  } catch (err) {
    if (!isMissingBlobsEnv(err)) throw err;
    await localSet(input.date, ep);
  }
  return ep;
}
