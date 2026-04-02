import { describe, expect, it } from "vitest";

import { occasionItemUpdateSchema, themeItemUpdateSchema } from "@/lib/validation";

describe("planner update validation", () => {
  it("accepts linked-item update payloads that include a nullable giftId", () => {
    // Regression: ISSUE-001 - linked planner updates failed because strict schemas rejected giftId
    // Found by /qa on 2026-04-02
    // Report: .gstack/qa-reports/qa-report-localhost-2026-04-02.md
    expect(
      themeItemUpdateSchema.safeParse({
        monthNumber: 2,
        giftId: null,
        draftName: null,
        draftNotes: null,
        draftProductUrl: null,
        draftTargetAmount: null,
      }).success,
    ).toBe(true);

    expect(
      occasionItemUpdateSchema.safeParse({
        sectionKey: "main",
        giftId: null,
        draftName: null,
        draftNotes: null,
        draftProductUrl: null,
        draftTargetAmount: null,
      }).success,
    ).toBe(true);
  });
});
