import { describe, expect, it } from "vitest";

import { formatMinorUnits, parseMoneyToMinorUnits, sumMinorUnits } from "@/lib/money";

describe("money helpers", () => {
  it("parses decimal strings into minor units", () => {
    expect(parseMoneyToMinorUnits("12.34")).toBe(1234);
  });

  it("sums minor units without floating point drift", () => {
    expect(sumMinorUnits(1000, 175, 225)).toBe(1400);
  });

  it("formats minor units for display", () => {
    expect(formatMinorUnits(1234, "USD")).toContain("12.34");
  });
});
