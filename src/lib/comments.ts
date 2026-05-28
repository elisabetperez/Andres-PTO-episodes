import { getStore } from "@netlify/blobs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

export type Comment = {
  id: string;
  author: string;     // email
  text: string;
  createdAt: string;  // ISO
};

const STORE_NAME = "comments";
const LOCAL_DIR = ".netlify/blobs-local";

export const MAX_COMMENT_CHARS = 280;

function isMissingBlobsEnv(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("environment has not been configured to use Netlify Blobs");
}

async function localGet(date: string): Promise<Comment[]> {
  const path = join(LOCAL_DIR, STORE_NAME, `${date}.json`);
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as Comment[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function localSet(date: string, data: Comment[]): Promise<void> {
  const path = join(LOCAL_DIR, STORE_NAME, `${date}.json`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf8");
}

export async function listComments(date: string): Promise<Comment[]> {
  try {
    const raw = await getStore(STORE_NAME).get(date, { type: "json" });
    return (raw as Comment[] | null) ?? [];
  } catch (err) {
    if (isMissingBlobsEnv(err)) return localGet(date);
    throw err;
  }
}

async function persist(date: string, data: Comment[]): Promise<void> {
  try {
    await getStore(STORE_NAME).setJSON(date, data);
  } catch (err) {
    if (!isMissingBlobsEnv(err)) throw err;
    await localSet(date, data);
  }
}

export async function addComment(
  date: string,
  author: string,
  text: string
): Promise<Comment[]> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Comentario vacío");
  if (trimmed.length > MAX_COMMENT_CHARS) {
    throw new Error(`Comentario supera ${MAX_COMMENT_CHARS} caracteres`);
  }
  const list = await listComments(date);
  const newComment: Comment = {
    id: randomBytes(8).toString("base64url"),
    author,
    text: trimmed,
    createdAt: new Date().toISOString(),
  };
  const updated = [...list, newComment];
  await persist(date, updated);
  return updated;
}

export async function deleteComment(
  date: string,
  id: string,
  requester: string
): Promise<Comment[]> {
  const list = await listComments(date);
  const target = list.find((c) => c.id === id);
  if (!target) return list;
  if (target.author !== requester) {
    throw new Error("No autorizado para borrar este comentario");
  }
  const updated = list.filter((c) => c.id !== id);
  await persist(date, updated);
  return updated;
}
