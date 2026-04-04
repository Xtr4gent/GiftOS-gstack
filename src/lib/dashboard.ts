import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { gifts, occasionGifts, occasionYears } from "@/db/schema";
import { getUpcomingOccasions } from "@/lib/dates";
import { buildHistoryAnalytics, loadHistoryRows } from "@/lib/history";
import { getOccasionConfigByType, plannableOccasionTypes, type PlannableOccasionType } from "@/lib/occasion-config";
import { getDashboardRecommendationHints } from "@/lib/recommendations";

export const spendTrackedStatuses = ["PURCHASED", "RECEIVED", "GIVEN"] as const;

type PlannerCoverage = {
  type: PlannableOccasionType;
  label: string;
  year: number;
  itemCount: number;
  linkedCount: number;
  draftCount: number;
  emptySections: number;
};

function getCurrentYearMonthPoints(amountsByMonth: Map<number, number>) {
  return Array.from({ length: 12 }, (_, monthIndex) => ({
    month: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
      new Date(Date.UTC(2026, monthIndex, 1)),
    ),
    amount: amountsByMonth.get(monthIndex) ?? 0,
  }));
}

async function getPlannerCoverage(userId: string, year: number) {
  const plans = await db
    .select({
      id: occasionYears.id,
      occasionType: occasionYears.occasionType,
      year: occasionYears.year,
    })
    .from(occasionYears)
    .where(and(eq(occasionYears.userId, userId), eq(occasionYears.year, year), inArray(occasionYears.occasionType, [...plannableOccasionTypes])));

  const coverageRows = await Promise.all(
    plans.map(async (plan) => {
      const items = await db
        .select({
          sectionKey: occasionGifts.sectionKey,
          giftId: occasionGifts.giftId,
        })
        .from(occasionGifts)
        .where(eq(occasionGifts.occasionYearId, plan.id));

      const config = getOccasionConfigByType(plan.occasionType as PlannableOccasionType);
      const sectionCounts = items.reduce<Record<string, number>>((acc, item) => {
        const key = plan.occasionType === "ANNIVERSARY" && item.sectionKey === "main" ? "open" : item.sectionKey;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});

      return {
        type: plan.occasionType as PlannableOccasionType,
        label: config.label,
        year: plan.year,
        itemCount: items.length,
        linkedCount: items.filter((item) => Boolean(item.giftId)).length,
        draftCount: items.filter((item) => !item.giftId).length,
        emptySections: config.sections.filter((section) => section.key !== "open" && !sectionCounts[section.key]).length,
      } satisfies PlannerCoverage;
    }),
  );

  const rowsByType = new Map(coverageRows.map((row) => [row.type, row]));

  return plannableOccasionTypes
    .map((type) => {
      const existing = rowsByType.get(type);
      if (existing) {
        return existing;
      }

      const config = getOccasionConfigByType(type);
      const relevantSections = config.sections.filter((section) => section.key !== "open");

      return {
        type,
        label: config.label,
        year,
        itemCount: 0,
        linkedCount: 0,
        draftCount: 0,
        emptySections: relevantSections.length,
      } satisfies PlannerCoverage;
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

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

  const recentGifts = await db.query.gifts.findMany({
    where: (gift, { and, eq }) => and(eq(gift.userId, userId), eq(gift.isArchived, false)),
    orderBy: [desc(gifts.createdAt)],
    limit: 5,
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

  const spendTrendRows = await db
    .select({
      createdAt: gifts.createdAt,
      totalAmount: gifts.totalAmount,
    })
    .from(gifts)
    .where(
      and(
        eq(gifts.userId, userId),
        eq(gifts.isArchived, false),
        gte(gifts.createdAt, yearStart),
        inArray(gifts.status, [...spendTrackedStatuses]),
      ),
    )
    .orderBy(desc(gifts.createdAt));

  const amountsByMonth = spendTrendRows.reduce<Map<number, number>>((acc, row) => {
    const month = new Date(row.createdAt).getMonth();
    acc.set(month, (acc.get(month) ?? 0) + row.totalAmount);
    return acc;
  }, new Map());

  const yearToDateSpend = Number(ytdRows[0]?.total ?? 0);
  const historyRows = await loadHistoryRows(userId);
  const historyAnalytics = buildHistoryAnalytics(historyRows);
  const recommendationHints = await getDashboardRecommendationHints({
    userId,
    yearToDateSpend,
    currencyCode: settingsRow?.defaultCurrencyCode ?? "USD",
    nextOccasion: upcomingOccasions[0] ?? null,
  });

  const plannerCoverage = await getPlannerCoverage(userId, new Date().getFullYear());

  return {
    settings: settingsRow,
    upcomingOccasions,
    nextOccasion: upcomingOccasions[0] ?? null,
    lastGiftGiven: lastGift,
    yearToDateSpend,
    recommendationHints,
    recentGifts,
    spendTrend: getCurrentYearMonthPoints(amountsByMonth),
    plannerCoverage,
    historyAnalytics,
  };
}
