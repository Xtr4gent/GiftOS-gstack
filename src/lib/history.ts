import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { giftImages, gifts, giftTags } from "@/db/schema";

type HistoryRow = {
  id: string;
  name: string;
  totalAmount: number;
  currencyCode: string;
  occasionType: string | null;
  givenAt: Date | null;
  createdAt: Date;
  imageId: string | null;
  tags: string[];
};

type HistoryYearGroup = {
  year: string;
  items: HistoryRow[];
};

type YearlySpendDatum = {
  year: string;
  amount: number;
  count: number;
};

type OccasionBreakdownDatum = {
  label: string;
  amount: number;
  count: number;
};

type MonthlySpendDatum = {
  month: string;
  [year: string]: number | string;
};

type TagPatternDatum = {
  tag: string;
  count: number;
  amount: number;
};

type HistoryAnalytics = {
  summary: {
    totalLifetimeSpend: number;
    totalGiftCount: number;
    averageGiftSpend: number;
    activeYears: number;
    currentYearSpend: number;
    previousYearSpend: number;
    yearOverYearDelta: number | null;
  };
  yearlySpend: YearlySpendDatum[];
  occasionBreakdown: OccasionBreakdownDatum[];
  monthlySpend: MonthlySpendDatum[];
  cadence: {
    averageDaysBetween: number | null;
    shortestGapDays: number | null;
    longestGapDays: number | null;
    mostRecentGapDays: number | null;
  };
  tagPatterns: TagPatternDatum[];
};

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function normalizeOccasionLabel(value: string | null) {
  switch (value) {
    case "BIRTHDAY":
      return "Birthday";
    case "ANNIVERSARY":
      return "Anniversary";
    case "CHRISTMAS":
      return "Christmas";
    case "VALENTINES":
      return "Valentine's";
    default:
      return "Unplanned";
  }
}

function daysBetween(left: Date, right: Date) {
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs(left.getTime() - right.getTime()) / oneDayMs);
}

export function groupGiftHistoryRows(rows: HistoryRow[]): HistoryYearGroup[] {
  const filtered = rows
    .filter((row) => row.givenAt)
    .sort((left, right) => {
      const givenAtDelta = new Date(right.givenAt as Date).getTime() - new Date(left.givenAt as Date).getTime();
      if (givenAtDelta !== 0) {
        return givenAtDelta;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

  const groups = filtered.reduce<Record<string, HistoryRow[]>>((acc, row) => {
    const year = new Date(row.givenAt as Date).getUTCFullYear().toString();
    acc[year] ??= [];
    acc[year].push(row);
    return acc;
  }, {});

  return Object.entries(groups)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, items]) => ({ year, items }));
}

export function buildHistoryAnalytics(rows: HistoryRow[]): HistoryAnalytics {
  const filtered = rows
    .filter((row): row is HistoryRow & { givenAt: Date } => Boolean(row.givenAt))
    .sort((left, right) => {
      const givenAtDelta = left.givenAt.getTime() - right.givenAt.getTime();
      if (givenAtDelta !== 0) {
        return givenAtDelta;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    });

  const yearlyMap = new Map<string, { amount: number; count: number }>();
  const occasionMap = new Map<string, { amount: number; count: number }>();
  const tagMap = new Map<string, { amount: number; count: number }>();

  for (const row of filtered) {
    const year = String(row.givenAt.getUTCFullYear());
    const yearly = yearlyMap.get(year) ?? { amount: 0, count: 0 };
    yearly.amount += row.totalAmount;
    yearly.count += 1;
    yearlyMap.set(year, yearly);

    const occasionLabel = normalizeOccasionLabel(row.occasionType);
    const occasion = occasionMap.get(occasionLabel) ?? { amount: 0, count: 0 };
    occasion.amount += row.totalAmount;
    occasion.count += 1;
    occasionMap.set(occasionLabel, occasion);

    for (const tag of row.tags) {
      const normalized = tag.trim();
      if (!normalized) continue;
      const tagEntry = tagMap.get(normalized) ?? { amount: 0, count: 0 };
      tagEntry.amount += row.totalAmount;
      tagEntry.count += 1;
      tagMap.set(normalized, tagEntry);
    }
  }

  const yearlySpend = [...yearlyMap.entries()]
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([year, entry]) => ({
      year,
      amount: entry.amount,
      count: entry.count,
    }));

  const occasionBreakdown = [...occasionMap.entries()]
    .map(([label, entry]) => ({
      label,
      amount: entry.amount,
      count: entry.count,
    }))
    .sort((left, right) => right.amount - left.amount);

  const distinctYears = [...new Set(filtered.map((row) => String(row.givenAt.getUTCFullYear())))].sort();
  const chartYears = distinctYears.slice(-2);
  const monthlySpend = monthLabels.map((month, monthIndex) => {
    const row: MonthlySpendDatum = { month };
    for (const year of chartYears) {
      row[year] = filtered
        .filter(
          (entry) =>
            String(entry.givenAt.getUTCFullYear()) === year && entry.givenAt.getUTCMonth() === monthIndex,
        )
        .reduce((sum, entry) => sum + entry.totalAmount, 0);
    }
    return row;
  });

  const cadenceGaps = filtered.slice(1).map((row, index) => daysBetween(row.givenAt, filtered[index].givenAt));
  const totalLifetimeSpend = filtered.reduce((sum, row) => sum + row.totalAmount, 0);
  const currentYear = yearlySpend.at(-1);
  const previousYear = yearlySpend.at(-2);

  return {
    summary: {
      totalLifetimeSpend,
      totalGiftCount: filtered.length,
      averageGiftSpend: filtered.length ? Math.round(totalLifetimeSpend / filtered.length) : 0,
      activeYears: yearlySpend.length,
      currentYearSpend: currentYear?.amount ?? 0,
      previousYearSpend: previousYear?.amount ?? 0,
      yearOverYearDelta:
        currentYear && previousYear && previousYear.amount > 0
          ? Number((((currentYear.amount - previousYear.amount) / previousYear.amount) * 100).toFixed(1))
          : null,
    },
    yearlySpend: yearlySpend.slice(-5),
    occasionBreakdown,
    monthlySpend,
    cadence: {
      averageDaysBetween: cadenceGaps.length
        ? Number((cadenceGaps.reduce((sum, value) => sum + value, 0) / cadenceGaps.length).toFixed(1))
        : null,
      shortestGapDays: cadenceGaps.length ? Math.min(...cadenceGaps) : null,
      longestGapDays: cadenceGaps.length ? Math.max(...cadenceGaps) : null,
      mostRecentGapDays: cadenceGaps.length ? cadenceGaps.at(-1) ?? null : null,
    },
    tagPatterns: [...tagMap.entries()]
      .map(([tag, entry]) => ({
        tag,
        count: entry.count,
        amount: entry.amount,
      }))
      .sort((left, right) => right.count - left.count || right.amount - left.amount)
      .slice(0, 6),
  };
}

export async function loadHistoryRows(userId: string): Promise<HistoryRow[]> {
  const rows = await db
    .select({
      id: gifts.id,
      name: gifts.name,
      totalAmount: gifts.totalAmount,
      currencyCode: gifts.currencyCode,
      occasionType: gifts.occasionType,
      givenAt: gifts.givenAt,
      createdAt: gifts.createdAt,
      imageId: giftImages.id,
    })
    .from(gifts)
    .leftJoin(giftImages, eq(giftImages.giftId, gifts.id))
    .where(eq(gifts.userId, userId))
    .orderBy(desc(gifts.givenAt), desc(gifts.createdAt));

  const tagRows = await db
    .select({
      giftId: giftTags.giftId,
      tag: giftTags.tag,
    })
    .from(giftTags)
    .innerJoin(gifts, eq(gifts.id, giftTags.giftId))
    .where(and(eq(gifts.userId, userId), eq(gifts.isArchived, false)));

  const tagsByGiftId = tagRows.reduce<Record<string, string[]>>((acc, row) => {
    acc[row.giftId] ??= [];
    acc[row.giftId].push(row.tag);
    return acc;
  }, {});

  return rows.map((row) => ({
    ...row,
    tags: tagsByGiftId[row.id] ?? [],
  }));
}

export async function getGiftHistory(userId: string) {
  const rows = await loadHistoryRows(userId);

  return {
    groups: groupGiftHistoryRows(rows),
    analytics: buildHistoryAnalytics(rows),
  };
}
