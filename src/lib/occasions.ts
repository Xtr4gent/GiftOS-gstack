import { and, asc, desc, eq, max, notInArray } from "drizzle-orm";

import { db } from "@/db/client";
import { giftImages, gifts, occasionGifts, occasionYears } from "@/db/schema";
import { getAnniversaryGuide, getOccasionConfigByType, type PlannableOccasionType } from "@/lib/occasion-config";
import { createGiftRecord } from "@/lib/gifts";

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

function assertValidSection(type: PlannableOccasionType, sectionKey: string) {
  const config = getOccasionConfigByType(type);
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
      sectionKey: occasionGifts.sectionKey,
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

  return row ?? null;
}

export async function getOccasionPlannerData(userId: string, type: PlannableOccasionType, year: number) {
  const config = getOccasionConfigByType(type);
  const plan = await ensureOccasionYear(userId, type, year);
  const settingsRow = await db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.userId, userId),
  });

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

  const linkedGiftIds = rows.map((row) => row.giftId).filter((value): value is string => Boolean(value));

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

  return {
    config,
    plan,
    guide: type === "ANNIVERSARY" ? getAnniversaryGuide(settingsRow, year) : null,
    years: existingYears.map((entry) => entry.year),
    availableGifts,
    sections: config.sections.map((section) => ({
      ...section,
      items: rows
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
    })),
  };
}

export async function createOccasionItem(
  userId: string,
  type: PlannableOccasionType,
  year: number,
  input: CreateOccasionItemInput,
) {
  assertValidSection(type, input.sectionKey);

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

  assertValidSection(owned.occasionType as PlannableOccasionType, input.sectionKey);

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
      position: occasionGifts.position,
    })
    .from(occasionGifts)
    .where(and(eq(occasionGifts.occasionYearId, owned.occasionYearId), eq(occasionGifts.sectionKey, owned.sectionKey)))
    .orderBy(asc(occasionGifts.position), asc(occasionGifts.createdAt));

  const index = candidates.findIndex((candidate) => candidate.id === itemId);
  const swapWith = direction === "up" ? candidates[index - 1] : candidates[index + 1];

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
