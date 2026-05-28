import { describe, it, expect } from "vitest";
import { episodeNumber, episodeLabel } from "@/lib/numbering";

describe("episodeNumber", () => {
  it("returns 1 for the only entry in a season", () => {
    expect(episodeNumber("2026-05-25", ["2026-05-25"])).toBe(1);
  });

  it("counts only entries within the same season as the target", () => {
    expect(
      episodeNumber("2026-06-03", ["2026-05-25", "2026-06-01", "2026-06-03"])
    ).toBe(2); // s1: 06-01 is 1, 06-03 is 2
  });

  it("counts in chronological order, regardless of input order", () => {
    expect(
      episodeNumber("2026-05-27", ["2026-05-29", "2026-05-25", "2026-05-27"])
    ).toBe(2);
  });

  it("returns null when target has no entry", () => {
    expect(episodeNumber("2026-05-26", ["2026-05-25"])).toBeNull();
  });

  it("returns null when target is outside all seasons", () => {
    expect(episodeNumber("2026-05-30", ["2026-05-30"])).toBeNull();
  });
});

describe("episodeLabel", () => {
  it("formats Pilotos as 'Pilotos · Ep 03'", () => {
    expect(
      episodeLabel("2026-05-27", ["2026-05-25", "2026-05-26", "2026-05-27"])
    ).toBe("Pilotos · Ep 03");
  });

  it("formats Temporada 1 as 'T1 · Ep 02'", () => {
    expect(episodeLabel("2026-06-03", ["2026-06-01", "2026-06-03"])).toBe(
      "T1 · Ep 02"
    );
  });

  it("returns null when there is no episode", () => {
    expect(episodeLabel("2026-05-26", [])).toBeNull();
  });
});
