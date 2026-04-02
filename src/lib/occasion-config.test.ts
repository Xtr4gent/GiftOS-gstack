import { describe, expect, it } from "vitest";

import { getAnniversaryGuide, getOccasionConfigBySlug, resolveOccasionConfig } from "@/lib/occasion-config";

describe("occasion config", () => {
  it("maps known slugs to occasion config", () => {
    expect(getOccasionConfigBySlug("christmas")?.type).toBe("CHRISTMAS");
    expect(getOccasionConfigBySlug("valentines")?.label).toBe("Valentine's Day");
  });

  it("derives anniversary guidance from the saved start year", () => {
    expect(
      getAnniversaryGuide(
        {
          userId: "user-1",
          birthdayMonth: null,
          birthdayDay: null,
          anniversaryMonth: 6,
          anniversaryDay: 12,
          anniversaryStartYear: 2020,
          timezone: "America/Toronto",
          defaultCurrencyCode: "USD",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        2025,
      ),
    ).toMatchObject({
      anniversaryNumber: 5,
      traditional: "Wood",
      modern: "Silverware",
      gemstone: "Sapphire",
    });
  });

  it("builds anniversary planner lanes from the computed rule set", () => {
    const resolved = resolveOccasionConfig(
      "ANNIVERSARY",
      2025,
      {
        userId: "user-1",
        birthdayMonth: null,
        birthdayDay: null,
        anniversaryMonth: 6,
        anniversaryDay: 12,
        anniversaryStartYear: 2020,
        timezone: "America/Toronto",
        defaultCurrencyCode: "USD",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    );

    expect(resolved.guide).toMatchObject({
      anniversaryNumber: 5,
      traditional: "Wood",
      modern: "Silverware",
      gemstone: "Sapphire",
    });
    expect(resolved.config.sections.map((section) => section.key)).toEqual([
      "traditional",
      "modern",
      "gemstone",
      "open",
    ]);
    expect(resolved.config.sections[0]?.label).toBe("Traditional: Wood");
  });

  it("adds christmas-specific summary and quick-add metadata", () => {
    const resolved = resolveOccasionConfig("CHRISTMAS", 2026, null);

    expect(resolved.config.plannerVariant).toBe("christmas");
    expect(resolved.config.sections.map((section) => section.key)).toEqual(["stocking", "main"]);
    expect(resolved.config.sections[0]).toMatchObject({
      key: "stocking",
      quickAddMode: "simple",
      summaryLabel: "Stuffers",
    });
    expect(resolved.config.sections[1]).toMatchObject({
      key: "main",
      quickAddMode: "full",
      summaryLabel: "Main gifts",
    });
  });

  it("builds birthday lanes around the saved yearly theme", () => {
    const resolved = resolveOccasionConfig("BIRTHDAY", 2026, null, "Cozy self-care");

    expect(resolved.config.plannerVariant).toBe("birthday");
    expect(resolved.config.plannerHeadline).toContain("Cozy self-care");
    expect(resolved.config.sections.map((section) => section.key)).toEqual(["headline", "supporting"]);
    expect(resolved.config.sections[0]).toMatchObject({
      key: "headline",
      quickAddMode: "full",
      summaryLabel: "Headline",
    });
    expect(resolved.config.sections[1]).toMatchObject({
      key: "supporting",
      quickAddMode: "simple",
      summaryLabel: "Supporting",
    });
  });
});
