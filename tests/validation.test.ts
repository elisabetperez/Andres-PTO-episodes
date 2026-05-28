import { describe, it, expect } from "vitest";
import {
  countWords,
  validateSummary,
  validateTitle,
  validateDate,
  MAX_SUMMARY_WORDS,
} from "@/lib/validation";

describe("countWords", () => {
  it("counts simple words", () => {
    expect(countWords("hola que tal")).toBe(3);
  });

  it("collapses multiple spaces and newlines", () => {
    expect(countWords("hola    que\n\ntal")).toBe(3);
  });

  it("trims leading and trailing whitespace", () => {
    expect(countWords("   hola que tal   ")).toBe(3);
  });

  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  it("treats emojis attached to a word as part of that word", () => {
    expect(countWords("🏖️hola")).toBe(1);
    expect(countWords("🏖️ hola")).toBe(2);
  });
});

describe("validateSummary", () => {
  it("accepts a 15-word summary", () => {
    const fifteen = "a b c d e f g h i j k l m n o";
    expect(validateSummary(fifteen)).toEqual({ ok: true });
  });

  it("rejects a 16-word summary with word count in the error", () => {
    const sixteen = "a b c d e f g h i j k l m n o p";
    expect(validateSummary(sixteen)).toEqual({
      ok: false,
      error: `Máximo ${MAX_SUMMARY_WORDS} palabras (tienes 16)`,
    });
  });

  it("accepts empty summary (optional field)", () => {
    expect(validateSummary("")).toEqual({ ok: true });
    expect(validateSummary("   ")).toEqual({ ok: true });
  });
});

describe("validateTitle", () => {
  it("accepts a non-empty title", () => {
    expect(validateTitle("🏖️ El que Andrés desaparece")).toEqual({ ok: true });
  });

  it("rejects empty title", () => {
    expect(validateTitle("")).toEqual({ ok: false, error: "Falta el título" });
    expect(validateTitle("   ")).toEqual({ ok: false, error: "Falta el título" });
  });
});

describe("validateDate", () => {
  it("accepts a YYYY-MM-DD date inside a season", () => {
    expect(validateDate("2026-05-25")).toEqual({ ok: true });
  });

  it("rejects a malformed date", () => {
    expect(validateDate("25-05-2026")).toEqual({
      ok: false,
      error: "Fecha mal formada (esperado YYYY-MM-DD)",
    });
    expect(validateDate("2026-5-25")).toEqual({
      ok: false,
      error: "Fecha mal formada (esperado YYYY-MM-DD)",
    });
  });

  it("rejects a date outside all seasons", () => {
    expect(validateDate("2026-05-30")).toEqual({
      ok: false,
      error: "Esa fecha no es del PTO de Andrés",
    });
  });
});
