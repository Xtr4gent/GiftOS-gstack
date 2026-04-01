import { describe, expect, it } from "vitest";

import { getThemeMonthSection, themeMonthSections } from "@/lib/theme-config";

describe("theme config", () => {
  it("defines all twelve month sections for the yearly theme planner", () => {
    expect(themeMonthSections).toHaveLength(12);
    expect(themeMonthSections[0]).toMatchObject({
      monthNumber: 1,
      label: "January",
    });
    expect(themeMonthSections[11]).toMatchObject({
      monthNumber: 12,
      label: "December",
    });
  });

  it("looks up a month section by number", () => {
    expect(getThemeMonthSection(5)?.slug).toBe("may");
    expect(getThemeMonthSection(13)).toBeNull();
  });
});
