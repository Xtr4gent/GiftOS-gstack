import { describe, expect, it, vi } from "vitest";

const { selectMock } = vi.hoisted(() => ({
  selectMock: vi.fn(() => ({
    from: vi.fn(() => ({
      innerJoin: vi.fn(() => ({
        where: vi.fn(() =>
          Promise.resolve([
            {
              id: "image-1",
              bucketKey: "gift-images/missing.png",
              mimeType: "image/png",
              userId: "user-1",
            },
          ]),
        ),
      })),
    })),
  })),
}));

vi.mock("@/db/client", () => ({
  db: {
    select: selectMock,
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1" },
  }),
}));

vi.mock("@/lib/bucket", () => ({
  readGiftImage: vi.fn().mockResolvedValue(null),
}));

import { GET } from "@/app/api/gift-images/[id]/route";

describe("gift image route", () => {
  it("returns 404 when the stored image object is missing", async () => {
    // Regression: ISSUE-002 - missing image files were surfacing as 502s in production.
    // Found by /qa on 2026-03-30
    // Report: .gstack/qa-reports/qa-report-giftos-gstack-production-up-railway-app-2026-03-30.md
    const response = await GET(new Request("http://localhost/api/gift-images/image-1"), {
      params: Promise.resolve({ id: "image-1" }),
    });

    expect(response.status).toBe(404);
  });
});
