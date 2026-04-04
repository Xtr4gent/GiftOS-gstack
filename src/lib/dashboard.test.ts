import { describe, expect, it, vi } from "vitest";

vi.mock("@/db/client", () => ({
  db: {
    query: {
      settings: {
        findFirst: vi.fn().mockResolvedValue({
          birthdayMonth: 6,
          birthdayDay: 10,
          anniversaryMonth: 9,
          anniversaryDay: 15,
          anniversaryStartYear: 2020,
          timezone: "America/Toronto",
          defaultCurrencyCode: "USD",
        }),
      },
      gifts: {
        findFirst: vi.fn().mockResolvedValue({
          id: "gift-last",
          name: "Anniversary flowers",
          totalAmount: 5500,
          currencyCode: "USD",
          createdAt: new Date("2026-03-01T00:00:00Z"),
        }),
        findMany: vi.fn().mockResolvedValue([
          {
            id: "gift-recent",
            name: "Recent gift",
            status: "IDEA",
            totalAmount: 1800,
            currencyCode: "USD",
            createdAt: new Date("2026-03-02T00:00:00Z"),
          },
        ]),
      },
    },
    select: vi
      .fn()
      .mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([{ total: 4200 }]),
        })),
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn().mockResolvedValue([
              {
                createdAt: new Date("2026-01-15T00:00:00Z"),
                totalAmount: 1200,
              },
              {
                createdAt: new Date("2026-02-10T00:00:00Z"),
                totalAmount: 3000,
              },
            ]),
          })),
        })),
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([
            {
              id: "plan-1",
              occasionType: "BIRTHDAY",
              year: new Date().getFullYear(),
            },
          ]),
        })),
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([
            { sectionKey: "headline", giftId: "gift-1" },
            { sectionKey: "supporting", giftId: null },
          ]),
        })),
      })),
  },
}));

vi.mock("@/lib/history", () => ({
  loadHistoryRows: vi.fn().mockResolvedValue([
    {
      id: "gift-1",
      name: "Anniversary flowers",
      totalAmount: 5500,
      currencyCode: "USD",
      occasionType: "ANNIVERSARY",
      givenAt: new Date("2026-02-01T00:00:00Z"),
      createdAt: new Date("2026-01-30T00:00:00Z"),
      imageId: null,
      tags: ["romantic"],
    },
  ]),
  buildHistoryAnalytics: vi.fn().mockReturnValue({
    summary: {
      totalLifetimeSpend: 5500,
      totalGiftCount: 1,
      averageGiftSpend: 5500,
      activeYears: 1,
      currentYearSpend: 5500,
      previousYearSpend: 0,
      yearOverYearDelta: null,
    },
    yearlySpend: [{ year: "2026", amount: 5500, count: 1 }],
    occasionBreakdown: [{ label: "Anniversary", amount: 5500, count: 1 }],
    monthlySpend: [{ month: "Jan", "2026": 5500 }],
    cadence: {
      averageDaysBetween: null,
      shortestGapDays: null,
      longestGapDays: null,
      mostRecentGapDays: null,
    },
    tagPatterns: [{ tag: "romantic", count: 1, amount: 5500 }],
  }),
}));

vi.mock("@/lib/recommendations", () => ({
  getDashboardRecommendationHints: vi.fn().mockResolvedValue([
    {
      type: "occasion-ready",
      title: "Start the plan",
      reason: "You do not have much queued yet.",
    },
  ]),
}));

import { getDashboardData, spendTrackedStatuses } from "@/lib/dashboard";

describe("dashboard read model", () => {
  it("returns richer dashboard payload with recent gifts, spend trend, planner coverage, and analytics", async () => {
    const payload = await getDashboardData("user-1");
    const birthdayCoverage = payload.plannerCoverage.find((entry) => entry.label === "Birthday");

    expect(payload.nextOccasion).toBeTruthy();
    expect(payload.lastGiftGiven?.name).toBe("Anniversary flowers");
    expect(payload.yearToDateSpend).toBe(4200);
    expect(payload.recentGifts).toHaveLength(1);
    expect(payload.spendTrend.find((entry) => entry.month === "Jan")?.amount).toBe(1200);
    expect(payload.spendTrend.find((entry) => entry.month === "Feb")?.amount).toBe(3000);
    expect(birthdayCoverage).toMatchObject({
      label: "Birthday",
      itemCount: 2,
      linkedCount: 1,
      draftCount: 1,
    });
    expect(payload.historyAnalytics.summary.totalLifetimeSpend).toBe(5500);
    expect(payload.recommendationHints).toHaveLength(1);
  });

  it("only counts purchased-or-later statuses in spend totals", () => {
    expect(spendTrackedStatuses).toEqual(["PURCHASED", "RECEIVED", "GIVEN"]);
  });
});
