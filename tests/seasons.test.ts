import { describe, it, expect } from "vitest";
import {
  SEASONS,
  getSeasonForDate,
  isInAnySeason,
  daysInSeason,
} from "@/config/seasons";

describe("SEASONS", () => {
  it("has Pilotos and Temporada 1 seasons", () => {
    expect(SEASONS).toHaveLength(2);
    expect(SEASONS[0].id).toBe("pilots");
    expect(SEASONS[1].id).toBe("s1");
  });
});

describe("getSeasonForDate", () => {
  it("returns Pilotos for 2026-05-25 (start) and 2026-05-29 (end)", () => {
    expect(getSeasonForDate("2026-05-25")?.id).toBe("pilots");
    expect(getSeasonForDate("2026-05-29")?.id).toBe("pilots");
  });

  it("returns Temporada 1 for 2026-06-15", () => {
    expect(getSeasonForDate("2026-06-15")?.id).toBe("s1");
  });

  it("returns null for 2026-05-30 (gap between seasons)", () => {
    expect(getSeasonForDate("2026-05-30")).toBeNull();
  });

  it("returns null for 2026-05-24 (before any season)", () => {
    expect(getSeasonForDate("2026-05-24")).toBeNull();
  });

  it("returns null for 2026-07-01 (after all seasons)", () => {
    expect(getSeasonForDate("2026-07-01")).toBeNull();
  });
});

describe("isInAnySeason", () => {
  it("returns true for in-range dates", () => {
    expect(isInAnySeason("2026-05-25")).toBe(true);
    expect(isInAnySeason("2026-06-30")).toBe(true);
  });

  it("returns false for out-of-range dates", () => {
    expect(isInAnySeason("2026-05-30")).toBe(false);
    expect(isInAnySeason("2025-01-01")).toBe(false);
  });
});

describe("daysInSeason", () => {
  it("returns 5 dates for Pilotos", () => {
    const dates = daysInSeason("pilots");
    expect(dates).toEqual([
      "2026-05-25",
      "2026-05-26",
      "2026-05-27",
      "2026-05-28",
      "2026-05-29",
    ]);
  });

  it("returns 30 dates for Temporada 1", () => {
    expect(daysInSeason("s1")).toHaveLength(30);
  });
});
