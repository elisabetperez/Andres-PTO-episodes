// Format an ISO YYYY-MM-DD date as a Spanish long-form phrase, e.g.
// "jueves 28 de mayo de 2026".

const FMT = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDateEs(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return FMT.format(d);
}
