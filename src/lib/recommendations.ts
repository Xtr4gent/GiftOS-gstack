import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { giftTags, gifts, occasionGifts, occasionYears } from "@/db/schema";
import { formatMinorUnits } from "@/lib/money";
import type { PlannableOccasionType } from "@/lib/occasion-config";

export type RecommendationHintType =
  | "repeat-risk"
  | "good-direction"
  | "budget-aware"
  | "occasion-ready"
  | "underused-tag";

export type RecommendationHint = {
  type: RecommendationHintType;
  title: string;
  reason: string;
};

type RecommendationGiftRow = {
  id: string;
  name: string;
  status: "IDEA" | "PURCHASED" | "RECEIVED" | "GIVEN";
  totalAmount: number;
  currencyCode: string;
  occasionType: string | null;
  occasionYear: number | null;
  createdAt: Date;
  givenAt: Date | null;
  tags: string[];
};

type PlannerSummary = {
  itemCount: number;
  linkedCount: number;
  draftCount: number;
  sections: Array<{ key: string; label: string; itemCount: number }>;
};

type HintContext = {
  yearToDateSpend: number;
  currencyCode: string;
  occasionType?: PlannableOccasionType | null;
  occasionLabel?: string | null;
  occasionYear?: number | null;
  daysRemaining?: number | null;
  plannerSummary?: PlannerSummary | null;
};

function deriveYearToDateSpend(giftRows: RecommendationGiftRow[]) {
  const currentYear = new Date().getFullYear();

  return giftRows
    .filter(
      (row) =>
        ["PURCHASED", "RECEIVED", "GIVEN"].includes(row.status) && row.createdAt.getFullYear() === currentYear,
    )
    .reduce((sum, row) => sum + row.totalAmount, 0);
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function countTags(rows: RecommendationGiftRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    for (const tag of row.tags.map(normalizeTag)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return counts;
}

export function buildRecommendationHints(giftRows: RecommendationGiftRow[], context: HintContext) {
  const hints: RecommendationHint[] = [];
  const givenRows = giftRows
    .filter((row) => row.givenAt)
    .sort((left, right) => {
      const givenDelta = new Date(right.givenAt as Date).getTime() - new Date(left.givenAt as Date).getTime();
      if (givenDelta !== 0) {
        return givenDelta;
      }

      return right.createdAt.getTime() - left.createdAt.getTime();
    });

  const recentGiven = givenRows.slice(0, 3);
  const recentTagCounts = countTags(recentGiven);
  const repeatRiskTag = [...recentTagCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  if (context.plannerSummary) {
    if (context.plannerSummary.itemCount === 0) {
      hints.push({
        type: "occasion-ready",
        title: `Start the ${context.occasionLabel ?? "next occasion"} plan`,
        reason: `There is nothing queued for ${context.occasionLabel?.toLowerCase() ?? "this occasion"} yet, so adding one anchor idea now will make the rest easier.`,
      });
    } else if (context.plannerSummary.draftCount > 0 && context.plannerSummary.linkedCount === 0) {
      hints.push({
        type: "occasion-ready",
        title: "Turn one draft into a real gift",
        reason: `You already have ${context.plannerSummary.draftCount} draft idea(s), but no anchored gift yet. Promoting one will make the plan feel real.`,
      });
    } else {
      const emptySections = context.plannerSummary.sections.filter(
        (section) => section.itemCount === 0 && section.key !== "open",
      );

      if (emptySections.length > 0) {
        hints.push({
          type: "occasion-ready",
          title: "Balance the planner lanes",
          reason: `${emptySections.map((section) => section.label).join(" and ")} still have no ideas, which is a good signal to widen the plan before you buy anything else.`,
        });
      }
    }
  }

  if (repeatRiskTag && repeatRiskTag[1] >= 2) {
    hints.push({
      type: "repeat-risk",
      title: `Watch the "${repeatRiskTag[0]}" pattern`,
      reason: `That tag showed up in ${repeatRiskTag[1]} of the last ${recentGiven.length} given gifts, so a different direction may feel fresher next time.`,
    });
  }

  const averageGivenSpend =
    recentGiven.length > 0
      ? Math.round(recentGiven.reduce((sum, gift) => sum + gift.totalAmount, 0) / recentGiven.length)
      : 0;

  if (
    averageGivenSpend > 0 &&
    context.daysRemaining !== null &&
    context.daysRemaining !== undefined &&
    context.daysRemaining <= 45 &&
    context.yearToDateSpend >= averageGivenSpend * 4
  ) {
    hints.push({
      type: "budget-aware",
      title: "Give yourself a budget reset",
      reason: `You are already at ${formatMinorUnits(context.yearToDateSpend, context.currencyCode)} year-to-date, so the next ${context.occasionLabel?.toLowerCase() ?? "occasion"} may be a good time for a smaller but thoughtful gift.`,
    });
  }

  const historicalTagCounts = countTags(givenRows);
  const recentTagSet = new Set(recentGiven.flatMap((gift) => gift.tags.map(normalizeTag)));
  const bestDirection = [...historicalTagCounts.entries()]
    .filter(([tag, count]) => count >= 2 && !recentTagSet.has(tag))
    .sort((a, b) => b[1] - a[1])[0];

  if (bestDirection) {
    hints.push({
      type: "good-direction",
      title: `Revisit "${bestDirection[0]}" in a new way`,
      reason: `That tag has landed well before but has not shown up in the most recent gifts, so it is a strong direction without feeling repetitive.`,
    });
  }

  const notYetGivenRows = giftRows.filter((row) => row.status !== "GIVEN");
  const ideaTagCounts = countTags(notYetGivenRows);
  const underusedTag = [...ideaTagCounts.entries()]
    .filter(([tag, count]) => count > 0 && !historicalTagCounts.has(tag))
    .sort((a, b) => b[1] - a[1])[0];

  if (underusedTag) {
    hints.push({
      type: "underused-tag",
      title: `Explore the "${underusedTag[0]}" lane`,
      reason: `You already have ideas carrying that tag, but nothing given in the history uses it yet. That makes it a good candidate for something new.`,
    });
  }

  const seen = new Set<RecommendationHintType>();
  return hints.filter((hint) => {
    if (seen.has(hint.type)) {
      return false;
    }

    seen.add(hint.type);
    return true;
  });
}

async function loadRecommendationGiftRows(userId: string) {
  const rows = await db
    .select({
      id: gifts.id,
      name: gifts.name,
      status: gifts.status,
      totalAmount: gifts.totalAmount,
      currencyCode: gifts.currencyCode,
      occasionType: gifts.occasionType,
      occasionYear: gifts.occasionYear,
      createdAt: gifts.createdAt,
      givenAt: gifts.givenAt,
    })
    .from(gifts)
    .where(and(eq(gifts.userId, userId), eq(gifts.isArchived, false)))
    .orderBy(desc(gifts.createdAt));

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

function mapOccasionLabelToType(label: string | null | undefined): PlannableOccasionType | null {
  switch (label) {
    case "Birthday":
      return "BIRTHDAY";
    case "Anniversary":
      return "ANNIVERSARY";
    default:
      return null;
  }
}

async function loadPlannerSummary(userId: string, occasionType: PlannableOccasionType, year: number) {
  const plan = await db.query.occasionYears.findFirst({
    where: and(eq(occasionYears.userId, userId), eq(occasionYears.occasionType, occasionType), eq(occasionYears.year, year)),
  });

  if (!plan) {
    return null;
  }

  const items = await db
    .select({
      sectionKey: occasionGifts.sectionKey,
      giftId: occasionGifts.giftId,
    })
    .from(occasionGifts)
    .where(eq(occasionGifts.occasionYearId, plan.id));

  const sectionCounts = items.reduce<Record<string, number>>((acc, item) => {
    const key = occasionType === "ANNIVERSARY" && item.sectionKey === "main" ? "open" : item.sectionKey;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    itemCount: items.length,
    linkedCount: items.filter((item) => Boolean(item.giftId)).length,
    draftCount: items.filter((item) => !item.giftId).length,
    sections: Object.entries(sectionCounts).map(([key, itemCount]) => ({
      key,
      label: key,
      itemCount,
    })),
  };
}

export async function getDashboardRecommendationHints(input: {
  userId: string;
  yearToDateSpend: number;
  currencyCode: string;
  nextOccasion?: { label: string; isoDate: string; daysRemaining: number } | null;
}) {
  try {
    const giftRows = await loadRecommendationGiftRows(input.userId);
    const occasionType = mapOccasionLabelToType(input.nextOccasion?.label);
    const occasionYear = input.nextOccasion ? new Date(input.nextOccasion.isoDate).getUTCFullYear() : null;
    const plannerSummary =
      occasionType && occasionYear
        ? await loadPlannerSummary(input.userId, occasionType, occasionYear)
        : null;

    return buildRecommendationHints(giftRows, {
      yearToDateSpend: input.yearToDateSpend,
      currencyCode: input.currencyCode,
      occasionType,
      occasionLabel: input.nextOccasion?.label ?? null,
      occasionYear,
      daysRemaining: input.nextOccasion?.daysRemaining ?? null,
      plannerSummary,
    }).slice(0, 3);
  } catch {
    return [];
  }
}

export async function getPlannerRecommendationHints(input: {
  userId: string;
  currencyCode: string;
  occasionType: PlannableOccasionType;
  occasionLabel: string;
  occasionYear: number;
  plannerSummary: PlannerSummary;
}) {
  try {
    const giftRows = await loadRecommendationGiftRows(input.userId);

    return buildRecommendationHints(giftRows, {
      yearToDateSpend: deriveYearToDateSpend(giftRows),
      currencyCode: input.currencyCode,
      occasionType: input.occasionType,
      occasionLabel: input.occasionLabel,
      occasionYear: input.occasionYear,
      daysRemaining: null,
      plannerSummary: input.plannerSummary,
    }).slice(0, 4);
  } catch {
    return [];
  }
}
