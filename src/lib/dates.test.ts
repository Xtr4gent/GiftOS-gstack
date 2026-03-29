import { describe, expect, it } from "vitest";

import { getUpcomingOccasions } from "@/lib/dates";

describe("occasion countdowns", () => {
  it("returns no occasions when settings are missing", () => {
    expect(
      getUpcomingOccasions({
        timezone: "America/Toronto",
      }),
    ).toEqual([]);
  });

  it("sorts occasions by nearest upcoming date", () => {
    const occasions = getUpcomingOccasions({
      birthdayMonth: 12,
      birthdayDay: 31,
      anniversaryMonth: 1,
      anniversaryDay: 1,
      anniversaryStartYear: 2020,
      timezone: "America/Toronto",
    });

    expect(occasions.length).toBe(2);
    expect(occasions[0]!.daysRemaining).toBeLessThanOrEqual(occasions[1]!.daysRemaining);
  });
});
