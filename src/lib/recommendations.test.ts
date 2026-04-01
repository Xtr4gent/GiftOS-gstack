import { describe, expect, it } from "vitest";

import { buildRecommendationHints } from "@/lib/recommendations";

describe("recommendation hints", () => {
  it("returns typed explainable hints from history and planner state", () => {
    const hints = buildRecommendationHints(
      [
        {
          id: "gift-1",
          name: "Gold necklace",
          status: "GIVEN",
          totalAmount: 15000,
          currencyCode: "USD",
          occasionType: "ANNIVERSARY",
          occasionYear: 2025,
          createdAt: new Date("2026-01-10T00:00:00Z"),
          givenAt: new Date("2026-01-12T00:00:00Z"),
          tags: ["jewelry", "gold"],
        },
        {
          id: "gift-2",
          name: "Gold bracelet",
          status: "GIVEN",
          totalAmount: 12000,
          currencyCode: "USD",
          occasionType: "BIRTHDAY",
          occasionYear: 2026,
          createdAt: new Date("2026-02-10T00:00:00Z"),
          givenAt: new Date("2026-02-12T00:00:00Z"),
          tags: ["jewelry", "gold"],
        },
        {
          id: "gift-3",
          name: "Spa pass idea",
          status: "IDEA",
          totalAmount: 9000,
          currencyCode: "USD",
          occasionType: "ANNIVERSARY",
          occasionYear: 2026,
          createdAt: new Date("2026-03-01T00:00:00Z"),
          givenAt: null,
          tags: ["wellness"],
        },
      ],
      {
        yearToDateSpend: 56000,
        currencyCode: "USD",
        occasionType: "ANNIVERSARY",
        occasionLabel: "Anniversary",
        occasionYear: 2026,
        daysRemaining: 20,
        plannerSummary: {
          itemCount: 1,
          linkedCount: 0,
          draftCount: 1,
          sections: [
            { key: "traditional", label: "Traditional", itemCount: 0 },
            { key: "modern", label: "Modern", itemCount: 0 },
            { key: "gemstone", label: "Gemstone", itemCount: 0 },
            { key: "open", label: "Open Ideas", itemCount: 1 },
          ],
        },
      },
    );

    expect(hints.map((hint) => hint.type)).toEqual(
      expect.arrayContaining(["occasion-ready", "repeat-risk", "budget-aware", "underused-tag"]),
    );
  });
});
