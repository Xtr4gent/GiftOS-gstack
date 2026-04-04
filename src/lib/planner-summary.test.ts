import { describe, expect, it } from "vitest";

import { buildPlannerSummary } from "@/lib/planner-summary";

describe("planner summary", () => {
  it("builds the richer valentine dashboard summary from planner counts", () => {
    const summary = buildPlannerSummary({
      variant: "valentines",
      sections: [
        { key: "gesture", label: "Main Gesture", itemCount: 0 },
        { key: "extras", label: "Sweet Extras", itemCount: 3 },
      ],
    });

    expect(summary).toMatchObject({
      variant: "valentines",
      eyebrow: "Romantic dashboard",
    });
    expect(summary?.cards.map((card) => card.eyebrow)).toEqual([
      "Main gesture",
      "Sweet extras",
      "Plan pulse",
      "Next move",
    ]);
    expect(summary?.cards[2]).toMatchObject({
      value: "Needs anchor",
    });
  });

  it("returns null for the default planner variant", () => {
    expect(
      buildPlannerSummary({
        variant: "default",
        sections: [],
      }),
    ).toBeNull();
  });
});
