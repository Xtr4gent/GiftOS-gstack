import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { gifts } from "@/db/schema";
import { getUpcomingOccasions } from "@/lib/dates";
import { getDashboardRecommendationHints } from "@/lib/recommendations";

export const spendTrackedStatuses = ["PURCHASED", "RECEIVED", "GIVEN"] as const;

export async function getDashboardData(userId: string) {
  const settingsRow = await db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.userId, userId),
  });

  const upcomingOccasions = getUpcomingOccasions({
    birthdayMonth: settingsRow?.birthdayMonth,
    birthdayDay: settingsRow?.birthdayDay,
    anniversaryMonth: settingsRow?.anniversaryMonth,
    anniversaryDay: settingsRow?.anniversaryDay,
    anniversaryStartYear: settingsRow?.anniversaryStartYear,
    timezone: settingsRow?.timezone ?? "America/Toronto",
  });

  const lastGift = await db.query.gifts.findFirst({
    where: (gift, { and, eq, isNotNull }) =>
      and(eq(gift.userId, userId), eq(gift.isArchived, false), isNotNull(gift.givenAt)),
    orderBy: [desc(gifts.givenAt), desc(gifts.createdAt)],
  });

  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const ytdRows = await db
    .select({
      total: sql<number>`coalesce(sum(${gifts.totalAmount}), 0)`,
    })
    .from(gifts)
    .where(
      and(
        eq(gifts.userId, userId),
        eq(gifts.isArchived, false),
        gte(gifts.createdAt, yearStart),
        inArray(gifts.status, [...spendTrackedStatuses]),
      ),
    );

  const yearToDateSpend = Number(ytdRows[0]?.total ?? 0);
  const recommendationHints = await getDashboardRecommendationHints({
    userId,
    yearToDateSpend,
    currencyCode: settingsRow?.defaultCurrencyCode ?? "USD",
    nextOccasion: upcomingOccasions[0] ?? null,
  });

  return {
    settings: settingsRow,
    upcomingOccasions,
    nextOccasion: upcomingOccasions[0] ?? null,
    lastGiftGiven: lastGift,
    yearToDateSpend,
    recommendationHints,
  };
}
