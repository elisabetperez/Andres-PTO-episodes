export type SeasonId = "pilots" | "s1";

export type Season = {
  id: SeasonId;
  label: string;
  start: string; // YYYY-MM-DD inclusive
  end: string;   // YYYY-MM-DD inclusive
};

export const SEASONS: readonly Season[] = [
  { id: "pilots", label: "Pilotos",     start: "2026-05-25", end: "2026-05-29" },
  { id: "s1",     label: "Temporada 1", start: "2026-06-01", end: "2026-06-30" },
] as const;

export function getSeasonForDate(date: string): Season | null {
  for (const s of SEASONS) {
    if (date >= s.start && date <= s.end) return s;
  }
  return null;
}

export function isInAnySeason(date: string): boolean {
  return getSeasonForDate(date) !== null;
}

export function daysInSeason(id: SeasonId): string[] {
  const season = SEASONS.find((s) => s.id === id);
  if (!season) return [];
  const out: string[] = [];
  const cur = new Date(season.start + "T00:00:00Z");
  const end = new Date(season.end + "T00:00:00Z");
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}
