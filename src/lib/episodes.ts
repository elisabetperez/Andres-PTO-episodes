import { getStore } from "@netlify/blobs";

export type Episode = {
  date: string;        // YYYY-MM-DD
  title: string;
  summary: string;
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
};

const STORE_NAME = "episodes";

function store() {
  return getStore(STORE_NAME);
}

export async function getEpisode(date: string): Promise<Episode | null> {
  const raw = await store().get(date, { type: "json" });
  return (raw as Episode | null) ?? null;
}

export async function listEpisodes(): Promise<Episode[]> {
  const { blobs } = await store().list();
  const items = await Promise.all(
    blobs.map((b) => store().get(b.key, { type: "json" }) as Promise<Episode | null>)
  );
  return items.filter((x): x is Episode => x !== null).sort((a, b) => a.date.localeCompare(b.date));
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
  await store().setJSON(input.date, ep);
  return ep;
}
