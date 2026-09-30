/**
 * Pure A/B test statistics: conversion rates, relative lift and a
 * two-proportion z-test (pooled standard error, two-sided p-value).
 */

export type Variant = { visitors: number; conversions: number };

export type AbTestResult = {
  rateA: number;
  rateB: number;
  /** Relative lift of B over A (0.1 = +10%). `null` when A's rate is 0. */
  lift: number | null;
  zScore: number;
  pValue: number;
  significant: boolean;
  winner: "A" | "B" | "none";
};

export type ValidationError = { field: keyof Variant; variant: "A" | "B"; message: string };

export function validateVariant(v: Variant, variant: "A" | "B"): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!Number.isInteger(v.visitors) || v.visitors <= 0) {
    errors.push({ field: "visitors", variant, message: `Variant ${variant}: visitors must be a whole number above 0` });
  }
  if (!Number.isInteger(v.conversions) || v.conversions < 0) {
    errors.push({ field: "conversions", variant, message: `Variant ${variant}: conversions must be a whole number of 0 or more` });
  } else if (v.conversions > v.visitors) {
    errors.push({ field: "conversions", variant, message: `Variant ${variant}: conversions cannot exceed visitors` });
  }
  return errors;
}

/** Standard normal CDF (Abramowitz & Stegun 7.1.26 erf approximation, |err| < 1.5e-7). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly =
    t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

export function analyze(a: Variant, b: Variant, alpha = 0.05): AbTestResult {
  const errors = [...validateVariant(a, "A"), ...validateVariant(b, "B")];
  if (errors.length > 0) throw new Error(errors.map((e) => e.message).join("; "));

  const rateA = a.conversions / a.visitors;
  const rateB = b.conversions / b.visitors;
  const pooled = (a.conversions + b.conversions) / (a.visitors + b.visitors);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / a.visitors + 1 / b.visitors));
  const zScore = se === 0 ? 0 : (rateB - rateA) / se;
  const pValue = zScore === 0 ? 1 : Math.min(1, 2 * (1 - normalCdf(Math.abs(zScore))));
  const significant = pValue < alpha;
  return {
    rateA,
    rateB,
    lift: rateA === 0 ? null : (rateB - rateA) / rateA,
    zScore,
    pValue,
    significant,
    winner: !significant ? "none" : rateB > rateA ? "B" : "A",
  };
}

/** Parse a user-typed count; returns NaN for anything that is not a plain non-negative integer. */
export function parseCount(text: string): number {
  const trimmed = text.trim().replace(/,/g, "");
  return /^\d+$/.test(trimmed) ? Number(trimmed) : NaN;
}

/** Raw text the user typed for both variants (persisted between sessions). */
export type Inputs = { a: { visitors: string; conversions: string }; b: { visitors: string; conversions: string } };

export const DEFAULT_INPUTS: Inputs = {
  a: { visitors: "1000", conversions: "100" },
  b: { visitors: "1000", conversions: "130" },
};

function isField(value: unknown): value is Inputs["a"] {
  if (typeof value !== "object" || value === null) return false;
  const f = value as Record<string, unknown>;
  return typeof f.visitors === "string" && typeof f.conversions === "string" && f.visitors.length <= 15 && f.conversions.length <= 15;
}

/** Type guard used when loading saved inputs from local storage. */
export function isInputs(value: unknown): value is Inputs {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return isField(v.a) && isField(v.b);
}

export function formatPercent(value: number, digits = 2): string {

  return `${(value * 100).toFixed(digits)}%`;
}
