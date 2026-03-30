import { describe, expect, it, vi } from "vitest";

const { findFirstGift } = vi.hoisted(() => ({
  findFirstGift: vi.fn().mockResolvedValue({
    name: "Newest same-day gift",
  }),
}));

vi.mock("@/db/client", () => ({
  db: {
    query: {
      settings: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      gifts: {
        findFirst: findFirstGift,
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ total: 0 }]),
      })),
    })),
  },
}));

import { getDashboardData } from "@/lib/dashboard";

describe("dashboard last gift query", () => {
  it("requests a same-day tie-breaker so the newest given gift wins", async () => {
    // Regression: ISSUE-001 - dashboard surfaced an older gift when multiple gifts shared the same given date.
    // Found by /qa on 2026-03-30
    // Report: .gstack/qa-reports/qa-report-giftos-gstack-production-up-railway-app-2026-03-30.md
    await getDashboardData("user-1");

    expect(findFirstGift).toHaveBeenCalledTimes(1);
    const [query] = findFirstGift.mock.calls[0] ?? [];
    expect(query.orderBy).toHaveLength(2);
  });
});
