import { describe, expect, it } from "vitest";

import { buildHistoryAnalytics, groupGiftHistoryRows } from "@/lib/history";

describe("history analytics", () => {
  const rows = [
    {
      id: "gift-1",
      name: "Anniversary flowers",
      totalAmount: 5000,
      currencyCode: "USD",
      occasionType: "ANNIVERSARY",
      givenAt: new Date("2025-02-14T00:00:00Z"),
      createdAt: new Date("2025-02-12T00:00:00Z"),
      imageId: null,
      tags: ["flowers", "romantic"],
    },
    {
      id: "gift-2",
      name: "Birthday necklace",
      totalAmount: 15000,
      currencyCode: "USD",
      occasionType: "BIRTHDAY",
      givenAt: new Date("2025-06-10T00:00:00Z"),
      createdAt: new Date("2025-06-01T00:00:00Z"),
      imageId: null,
      tags: ["jewelry"],
    },
    {
      id: "gift-3",
      name: "Christmas slippers",
      totalAmount: 4000,
      currencyCode: "USD",
      occasionType: "CHRISTMAS",
      givenAt: new Date("2026-12-24T00:00:00Z"),
      createdAt: new Date("2026-12-20T00:00:00Z"),
      imageId: null,
      tags: ["cozy"],
    },
    {
      id: "gift-4",
      name: "Valentine note set",
      totalAmount: 3000,
      currencyCode: "USD",
      occasionType: "VALENTINES",
      givenAt: new Date("2026-02-14T00:00:00Z"),
      createdAt: new Date("2026-02-10T00:00:00Z"),
      imageId: null,
      tags: ["romantic", "paper"],
    },
  ];

  it("groups history by given year newest first", () => {
    const groups = groupGiftHistoryRows(rows);

    expect(groups.map((group) => group.year)).toEqual(["2026", "2025"]);
    expect(groups[0]?.items.map((item) => item.name)).toEqual(["Christmas slippers", "Valentine note set"]);
  });

  it("builds yearly, occasion, cadence, and tag analytics from the given gifts", () => {
    const analytics = buildHistoryAnalytics(rows);

    expect(analytics.summary).toMatchObject({
      totalLifetimeSpend: 27000,
      totalGiftCount: 4,
      averageGiftSpend: 6750,
      activeYears: 2,
      currentYearSpend: 7000,
      previousYearSpend: 20000,
      yearOverYearDelta: -65,
    });
    expect(analytics.yearlySpend).toEqual([
      { year: "2025", amount: 20000, count: 2 },
      { year: "2026", amount: 7000, count: 2 },
    ]);
    expect(analytics.occasionBreakdown[0]).toMatchObject({
      label: "Birthday",
      amount: 15000,
      count: 1,
    });
    expect(analytics.monthlySpend.find((entry) => entry.month === "Feb")).toMatchObject({
      month: "Feb",
      "2025": 5000,
      "2026": 3000,
    });
    expect(analytics.tagPatterns[0]).toMatchObject({
      tag: "romantic",
      count: 2,
      amount: 8000,
    });
  });
});
