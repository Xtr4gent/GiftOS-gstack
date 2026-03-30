import { describe, expect, it } from "vitest";

import { getAnniversaryGuide, getOccasionConfigBySlug } from "@/lib/occasion-config";

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
});
