import { describe, expect, it } from "vitest";

import { groupGiftHistoryRows } from "@/lib/history";

describe("gift history ordering", () => {
  it("keeps newer same-day gifts ahead of older ones", () => {
    // Regression: ISSUE-001 - same-day gifts were shown in the wrong order in History.
    // Found by /qa on 2026-03-30
    // Report: .gstack/qa-reports/qa-report-giftos-gstack-production-up-railway-app-2026-03-30.md
    const groups = groupGiftHistoryRows([
      {
        id: "older",
        name: "Older same-day gift",
        totalAmount: 1000,
        currencyCode: "USD",
        occasionType: null,
        givenAt: new Date("2026-03-30T00:00:00.000Z"),
        createdAt: new Date("2026-03-30T12:00:00.000Z"),
        imageId: null,
      },
      {
        id: "newer",
        name: "Newer same-day gift",
        totalAmount: 2000,
        currencyCode: "USD",
        occasionType: null,
        givenAt: new Date("2026-03-30T00:00:00.000Z"),
        createdAt: new Date("2026-03-30T13:00:00.000Z"),
        imageId: null,
      },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.items.map((item) => item.name)).toEqual(["Newer same-day gift", "Older same-day gift"]);
  });
});
