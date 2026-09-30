import { describe, expect, it } from "vitest";
import {
  DEFAULT_INPUTS,
  analyze,
  formatPercent,
  isInputs,
  normalCdf,
  parseCount,
  validateVariant,
} from "./abTest";

describe("isInputs", () => {
  it("accepts saved inputs and rejects malformed ones", () => {
    expect(isInputs(DEFAULT_INPUTS)).toBe(true);
    expect(isInputs({ a: { visitors: "1", conversions: "0" } })).toBe(false);
    expect(isInputs({ a: { visitors: 1, conversions: "0" }, b: DEFAULT_INPUTS.b })).toBe(false);
    expect(isInputs({ a: { visitors: "9".repeat(40), conversions: "0" }, b: DEFAULT_INPUTS.b })).toBe(false);
    expect(isInputs(null)).toBe(false);
  });
});

describe("normalCdf", () => {
  it("matches known values", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
  });
});

describe("analyze", () => {
  it("detects a significant winner", () => {
    const r = analyze({ visitors: 1000, conversions: 100 }, { visitors: 1000, conversions: 150 });
    expect(r.rateA).toBeCloseTo(0.1);
    expect(r.rateB).toBeCloseTo(0.15);
    expect(r.lift).toBeCloseTo(0.5);
    expect(r.zScore).toBeCloseTo(3.38, 1);
    expect(r.pValue).toBeLessThan(0.001);
    expect(r.significant).toBe(true);
    expect(r.winner).toBe("B");
  });

  it("reports no winner for a small difference", () => {
    const r = analyze({ visitors: 200, conversions: 20 }, { visitors: 200, conversions: 22 });
    expect(r.significant).toBe(false);
    expect(r.winner).toBe("none");
  });

  it("can pick A as the winner", () => {
    const r = analyze({ visitors: 500, conversions: 100 }, { visitors: 500, conversions: 50 });
    expect(r.winner).toBe("A");
    expect(r.lift).toBeCloseTo(-0.5);
  });

  it("handles zero conversions without NaN", () => {
    const r = analyze({ visitors: 100, conversions: 0 }, { visitors: 100, conversions: 0 });
    expect(r.zScore).toBe(0);
    expect(r.pValue).toBe(1);
    expect(r.lift).toBeNull();
  });

  it("rejects invalid input", () => {
    expect(() => analyze({ visitors: 10, conversions: 11 }, { visitors: 10, conversions: 1 })).toThrow(/exceed/);
    expect(validateVariant({ visitors: 0, conversions: 0 }, "B")).toHaveLength(1);
    expect(validateVariant({ visitors: NaN, conversions: NaN }, "A")).toHaveLength(2);
  });
});

describe("helpers", () => {
  it("parses counts strictly", () => {
    expect(parseCount(" 1,200 ")).toBe(1200);
    expect(parseCount("12.5")).toBeNaN();
    expect(parseCount("-3")).toBeNaN();
    expect(parseCount("")).toBeNaN();
  });
  it("formats percentages", () => {
    expect(formatPercent(0.1234)).toBe("12.34%");
  });
});
