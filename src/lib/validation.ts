import { isInAnySeason } from "@/config/seasons";

export const MAX_SUMMARY_WORDS = 15;

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function countWords(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function validateSummary(s: string): ValidationResult {
  if (!s.trim()) return { ok: true }; // opcional
  const n = countWords(s);
  if (n > MAX_SUMMARY_WORDS) {
    return {
      ok: false,
      error: `Máximo ${MAX_SUMMARY_WORDS} palabras (tienes ${n})`,
    };
  }
  return { ok: true };
}

export function validateTitle(t: string): ValidationResult {
  if (!t.trim()) return { ok: false, error: "Falta el título" };
  return { ok: true };
}

export function validateDate(d: string): ValidationResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return { ok: false, error: "Fecha mal formada (esperado YYYY-MM-DD)" };
  }
  if (!isInAnySeason(d)) {
    return { ok: false, error: "Esa fecha no es del PTO de Andrés" };
  }
  return { ok: true };
}
