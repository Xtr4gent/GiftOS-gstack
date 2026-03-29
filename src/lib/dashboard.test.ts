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
          name: "Anniversary flowers",
        }),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ total: 4200 }]),
      })),
    })),
  },
}));

import { getDashboardData } from "@/lib/dashboard";
import { spendTrackedStatuses } from "@/lib/dashboard";

describe("dashboard read model", () => {
  it("returns next occasion and ytd spend", async () => {
    const payload = await getDashboardData("user-1");

    expect(payload.nextOccasion).toBeTruthy();
    expect(payload.lastGiftGiven?.name).toBe("Anniversary flowers");
    expect(payload.yearToDateSpend).toBe(4200);
  });

  it("only counts purchased-or-later statuses in spend totals", () => {
    expect(spendTrackedStatuses).toEqual(["PURCHASED", "RECEIVED", "GIVEN"]);
  });
});
