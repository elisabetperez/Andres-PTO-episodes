import { getSeasonForDate } from "@/config/seasons";

export function episodeNumber(
  date: string,
  allEntryDates: readonly string[]
): number | null {
  const season = getSeasonForDate(date);
  if (!season) return null;
  if (!allEntryDates.includes(date)) return null;
  const inSeason = allEntryDates
    .filter((d) => {
      const s = getSeasonForDate(d);
      return s && s.id === season.id;
    })
    .sort();
  const idx = inSeason.indexOf(date);
  return idx === -1 ? null : idx + 1;
}

export function episodeLabel(
  date: string,
  allEntryDates: readonly string[]
): string | null {
  const n = episodeNumber(date, allEntryDates);
  if (n === null) return null;
  const season = getSeasonForDate(date)!;
  const padded = String(n).padStart(2, "0");
  if (season.id === "pilots") return `Piloto ${padded}`;
  return `Temporada 1 · Ep ${padded}`;
}
