import { and, asc, desc, eq, max, notInArray } from "drizzle-orm";

import { db } from "@/db/client";
import { giftImages, gifts, occasionGifts, occasionYears } from "@/db/schema";
import { resolveOccasionConfig, type PlannableOccasionType } from "@/lib/occasion-config";
import { createGiftRecord } from "@/lib/gifts";
import { getPlannerRecommendationHints } from "@/lib/recommendations";

type DbClient = Pick<typeof db, "select" | "insert" | "update" | "delete">;

type CreateOccasionItemInput = {
  sectionKey: string;
  giftId?: string | null;
  draftName?: string | null;
  draftNotes?: string | null;
  draftProductUrl?: string | null;
  draftTargetAmount?: number | null;
};

type UpdateOccasionItemInput = {
  sectionKey: string;
  draftName?: string | null;
  draftNotes?: string | null;
  draftProductUrl?: string | null;
  draftTargetAmount?: number | null;
};

type UpdateOccasionYearInput = {
  themeName?: string | null;
};

export async function ensureOccasionYear(userId: string, type: PlannableOccasionType, year: number) {
  return db.transaction(async (tx) => ensureOccasionYearRecord(tx, userId, type, year));
}

async function ensureOccasionYearRecord(tx: DbClient, userId: string, type: PlannableOccasionType, year: number) {
  const existing = await db.query.occasionYears.findFirst({
    where: and(eq(occasionYears.userId, userId), eq(occasionYears.occasionType, type), eq(occasionYears.year, year)),
  });

  if (existing) {
    return existing;
  }

  const [created] = await tx
    .insert(occasionYears)
    .values({
      userId,
      occasionType: type,
      year,
    })
    .returning();

  return created;
}

export async function updateOccasionYear(userId: string, type: PlannableOccasionType, year: number, input: UpdateOccasionYearInput) {
  const plan = await ensureOccasionYear(userId, type, year);

  const [updated] = await db
    .update(occasionYears)
    .set({
      themeName: input.themeName ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(occasionYears.id, plan.id), eq(occasionYears.userId, userId)))
    .returning();

  return updated;
}

function normalizeSectionKey(type: PlannableOccasionType, sectionKey: string) {
  if (type === "ANNIVERSARY" && sectionKey === "main") {
    return "open";
  }

  return sectionKey;
}

function assertValidSection(
  type: PlannableOccasionType,
  sectionKey: string,
  year: number,
  settingsRow: Awaited<ReturnType<typeof db.query.settings.findFirst>>,
) {
  const { config } = resolveOccasionConfig(type, year, settingsRow);
  if (!config.sections.some((section) => section.key === sectionKey)) {
    throw new Error("Invalid planner section.");
  }
}

async function getOwnedOccasionItem(userId: string, itemId: string) {
  const [row] = await db
    .select({
      itemId: occasionGifts.id,
      occasionYearId: occasionYears.id,
      occasionType: occasionYears.occasionType,
      year: occasionYears.year,
      rawSectionKey: occasionGifts.sectionKey,
      position: occasionGifts.position,
      giftId: occasionGifts.giftId,
      draftName: occasionGifts.draftName,
      draftNotes: occasionGifts.draftNotes,
      draftProductUrl: occasionGifts.draftProductUrl,
      draftTargetAmount: occasionGifts.draftTargetAmount,
    })
    .from(occasionGifts)
    .innerJoin(occasionYears, eq(occasionYears.id, occasionGifts.occasionYearId))
    .where(and(eq(occasionGifts.id, itemId), eq(occasionYears.userId, userId)));

  if (!row) {
    return null;
  }

  return {
    ...row,
    sectionKey: normalizeSectionKey(row.occasionType as PlannableOccasionType, row.rawSectionKey),
  };
}

export async function getOccasionPlannerData(userId: string, type: PlannableOccasionType, year: number) {
  const plan = await ensureOccasionYear(userId, type, year);
  const settingsRow = await db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.userId, userId),
  });
  const { config, guide } = resolveOccasionConfig(type, year, settingsRow, plan.themeName);

  const rows = await db
    .select({
      id: occasionGifts.id,
      sectionKey: occasionGifts.sectionKey,
      position: occasionGifts.position,
      draftName: occasionGifts.draftName,
      draftNotes: occasionGifts.draftNotes,
      draftProductUrl: occasionGifts.draftProductUrl,
      draftTargetAmount: occasionGifts.draftTargetAmount,
      giftId: gifts.id,
      giftName: gifts.name,
      giftStatus: gifts.status,
      giftTotalAmount: gifts.totalAmount,
      giftCurrencyCode: gifts.currencyCode,
      giftProductUrl: gifts.productUrl,
      imageId: giftImages.id,
      createdAt: occasionGifts.createdAt,
    })
    .from(occasionGifts)
    .leftJoin(gifts, eq(gifts.id, occasionGifts.giftId))
    .leftJoin(giftImages, eq(giftImages.giftId, gifts.id))
    .where(eq(occasionGifts.occasionYearId, plan.id))
    .orderBy(asc(occasionGifts.sectionKey), asc(occasionGifts.position), asc(occasionGifts.createdAt));

  const normalizedRows = rows.map((row) => ({
    ...row,
    sectionKey: normalizeSectionKey(type, row.sectionKey),
  }));

  const linkedGiftIds = normalizedRows.map((row) => row.giftId).filter((value): value is string => Boolean(value));

  const availableGifts = await db
    .select({
      id: gifts.id,
      name: gifts.name,
      status: gifts.status,
      totalAmount: gifts.totalAmount,
      currencyCode: gifts.currencyCode,
      isPinned: gifts.isPinned,
    })
    .from(gifts)
    .where(
      linkedGiftIds.length > 0
        ? and(eq(gifts.userId, userId), eq(gifts.isArchived, false), notInArray(gifts.id, linkedGiftIds))
        : and(eq(gifts.userId, userId), eq(gifts.isArchived, false)),
    )
    .orderBy(desc(gifts.isPinned), desc(gifts.createdAt));

  const existingYears = await db
    .select({ year: occasionYears.year })
    .from(occasionYears)
    .where(and(eq(occasionYears.userId, userId), eq(occasionYears.occasionType, type)))
    .orderBy(desc(occasionYears.year));

  const sections = config.sections.map((section) => ({
    ...section,
    items: normalizedRows
      .filter((row) => row.sectionKey === section.key)
      .map((row) =>
        row.giftId
          ? {
              id: row.id,
              kind: "linked" as const,
              sectionKey: row.sectionKey,
              position: row.position,
              gift: {
                id: row.giftId,
                name: row.giftName ?? "Untitled gift",
                status: row.giftStatus ?? "IDEA",
                totalAmount: row.giftTotalAmount ?? 0,
                currencyCode: row.giftCurrencyCode ?? settingsRow?.defaultCurrencyCode ?? "USD",
                productUrl: row.giftProductUrl,
                imageId: row.imageId,
              },
            }
          : {
              id: row.id,
              kind: "draft" as const,
              sectionKey: row.sectionKey,
              position: row.position,
              draftName: row.draftName,
              draftNotes: row.draftNotes,
              draftProductUrl: row.draftProductUrl,
              draftTargetAmount: row.draftTargetAmount,
            },
      ),
  }));

  const recommendationHints = await getPlannerRecommendationHints({
    userId,
    currencyCode: settingsRow?.defaultCurrencyCode ?? "USD",
    occasionType: type,
    occasionLabel: config.label,
    occasionYear: year,
    plannerSummary: {
      itemCount: sections.reduce((sum, section) => sum + section.items.length, 0),
      linkedCount: sections.reduce(
        (sum, section) => sum + section.items.filter((item) => item.kind === "linked").length,
        0,
      ),
      draftCount: sections.reduce(
        (sum, section) => sum + section.items.filter((item) => item.kind === "draft").length,
        0,
      ),
      sections: sections.map((section) => ({
        key: section.key,
        label: section.label,
        itemCount: section.items.length,
      })),
    },
  });

  return {
    config,
    plan,
    guide,
    years: existingYears.map((entry) => entry.year),
    availableGifts,
    sections,
    recommendationHints,
  };
}

export async function createOccasionItem(
  userId: string,
  type: PlannableOccasionType,
  year: number,
  input: CreateOccasionItemInput,
) {
  const settingsRow = await db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.userId, userId),
  });
  assertValidSection(type, input.sectionKey, year, settingsRow);

  return db.transaction(async (tx) => {
    const plan = await ensureOccasionYearRecord(tx, userId, type, year);

    if (input.giftId) {
      const existingGift = await db.query.gifts.findFirst({
        where: and(eq(gifts.id, input.giftId), eq(gifts.userId, userId)),
      });

      if (!existingGift) {
        throw new Error("Gift not found.");
      }

      const duplicate = await db.query.occasionGifts.findFirst({
        where: and(eq(occasionGifts.occasionYearId, plan.id), eq(occasionGifts.giftId, input.giftId)),
      });

      if (duplicate) {
        throw new Error("That gift is already part of this plan.");
      }
    }

    const [positionRow] = await db
      .select({ value: max(occasionGifts.position) })
      .from(occasionGifts)
      .where(and(eq(occasionGifts.occasionYearId, plan.id), eq(occasionGifts.sectionKey, input.sectionKey)));

    const [created] = await tx
      .insert(occasionGifts)
      .values({
        occasionYearId: plan.id,
        giftId: input.giftId ?? null,
        sectionKey: input.sectionKey,
        position: (positionRow?.value ?? -1) + 1,
        draftName: input.draftName ?? null,
        draftNotes: input.draftNotes ?? null,
        draftProductUrl: input.draftProductUrl ?? null,
        draftTargetAmount: input.draftTargetAmount ?? null,
      })
      .returning();

    return created;
  });
}

export async function updateOccasionItem(userId: string, itemId: string, input: UpdateOccasionItemInput) {
  const owned = await getOwnedOccasionItem(userId, itemId);
  if (!owned) {
    throw new Error("Planner item not found.");
  }

  const settingsRow = await db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.userId, userId),
  });
  assertValidSection(owned.occasionType as PlannableOccasionType, input.sectionKey, owned.year, settingsRow);

  await db
    .update(occasionGifts)
    .set({
      sectionKey: input.sectionKey,
      draftName: owned.giftId ? null : input.draftName ?? null,
      draftNotes: owned.giftId ? null : input.draftNotes ?? null,
      draftProductUrl: owned.giftId ? null : input.draftProductUrl ?? null,
      draftTargetAmount: owned.giftId ? null : input.draftTargetAmount ?? null,
      updatedAt: new Date(),
    })
    .where(eq(occasionGifts.id, itemId));
}

export async function moveOccasionItem(userId: string, itemId: string, direction: "up" | "down") {
  const owned = await getOwnedOccasionItem(userId, itemId);
  if (!owned) {
    throw new Error("Planner item not found.");
  }

  const candidates = await db
    .select({
      id: occasionGifts.id,
      sectionKey: occasionGifts.sectionKey,
      position: occasionGifts.position,
      createdAt: occasionGifts.createdAt,
    })
    .from(occasionGifts)
    .where(eq(occasionGifts.occasionYearId, owned.occasionYearId))
    .orderBy(asc(occasionGifts.position), asc(occasionGifts.createdAt));

  const laneCandidates = candidates.filter(
    (candidate) => normalizeSectionKey(owned.occasionType as PlannableOccasionType, candidate.sectionKey) === owned.sectionKey,
  );

  const index = laneCandidates.findIndex((candidate) => candidate.id === itemId);
  const swapWith = direction === "up" ? laneCandidates[index - 1] : laneCandidates[index + 1];

  if (!swapWith) {
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(occasionGifts)
      .set({
        position: swapWith.position,
        updatedAt: new Date(),
      })
      .where(eq(occasionGifts.id, owned.itemId));

    await tx
      .update(occasionGifts)
      .set({
        position: owned.position,
        updatedAt: new Date(),
      })
      .where(eq(occasionGifts.id, swapWith.id));
  });
}

export async function deleteOccasionItem(userId: string, itemId: string) {
  const owned = await getOwnedOccasionItem(userId, itemId);
  if (!owned) {
    throw new Error("Planner item not found.");
  }

  await db.delete(occasionGifts).where(eq(occasionGifts.id, itemId));
}

export async function promoteOccasionItemToGift(userId: string, itemId: string) {
  const owned = await getOwnedOccasionItem(userId, itemId);
  if (!owned) {
    throw new Error("Planner item not found.");
  }

  if (owned.giftId) {
    return owned.giftId;
  }

  if (!owned.draftName) {
    throw new Error("Draft ideas need a name before they can become gifts.");
  }

  const settingsRow = await db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.userId, userId),
  });

  const createdGift = await db.transaction(async (tx) => {
    const gift = await createGiftRecord(tx, {
      userId,
      name: owned.draftName!,
      notes: owned.draftNotes,
      productUrl: owned.draftProductUrl,
      storeName: null,
      currencyCode: settingsRow?.defaultCurrencyCode ?? "USD",
      basePriceAmount: owned.draftTargetAmount ?? 0,
      taxAmount: 0,
      shippingAmount: 0,
      totalAmount: owned.draftTargetAmount ?? 0,
      status: "IDEA",
      isOneOff: true,
      occasionType: owned.occasionType as PlannableOccasionType,
      occasionYear: owned.year,
      tags: [],
    });

    await tx
      .update(occasionGifts)
      .set({
        giftId: gift.id,
        draftName: null,
        draftNotes: null,
        draftProductUrl: null,
        draftTargetAmount: null,
        updatedAt: new Date(),
      })
      .where(eq(occasionGifts.id, itemId));

    return gift;
  });

  return createdGift.id;
}
