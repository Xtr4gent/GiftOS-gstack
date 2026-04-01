import { and, asc, desc, eq, max, notInArray } from "drizzle-orm";

import { db } from "@/db/client";
import { giftImages, gifts, themeMonthItems, themeYears } from "@/db/schema";
import { createGiftRecord } from "@/lib/gifts";
import { getDefaultOccasionSectionKey, getOccasionConfigByType, type PlannableOccasionType, plannableOccasionTypes } from "@/lib/occasion-config";
import { createOccasionItem } from "@/lib/occasions";
import { getThemeMonthSection, themeMonthSections } from "@/lib/theme-config";

type DbClient = Pick<typeof db, "select" | "insert" | "update" | "delete">;

type CreateThemeItemInput = {
  monthNumber: number;
  giftId?: string | null;
  draftName?: string | null;
  draftNotes?: string | null;
  draftProductUrl?: string | null;
  draftTargetAmount?: number | null;
};

type UpdateThemeItemInput = {
  monthNumber: number;
  draftName?: string | null;
  draftNotes?: string | null;
  draftProductUrl?: string | null;
  draftTargetAmount?: number | null;
};

type UpdateThemeYearInput = {
  name: string;
  description?: string | null;
};

function assertValidMonth(monthNumber: number) {
  if (!getThemeMonthSection(monthNumber)) {
    throw new Error("Invalid month.");
  }
}

export async function ensureThemeYear(userId: string, year: number) {
  return db.transaction(async (tx) => ensureThemeYearRecord(tx, userId, year));
}

async function ensureThemeYearRecord(tx: DbClient, userId: string, year: number) {
  const existing = await db.query.themeYears.findFirst({
    where: and(eq(themeYears.userId, userId), eq(themeYears.year, year)),
  });

  if (existing) {
    return existing;
  }

  const [created] = await tx
    .insert(themeYears)
    .values({
      userId,
      year,
      name: "Theme of the Year",
      description: null,
    })
    .returning();

  return created;
}

async function getOwnedThemeItem(userId: string, itemId: string) {
  const [row] = await db
    .select({
      itemId: themeMonthItems.id,
      themeYearId: themeYears.id,
      year: themeYears.year,
      monthNumber: themeMonthItems.monthNumber,
      position: themeMonthItems.position,
      giftId: themeMonthItems.giftId,
      draftName: themeMonthItems.draftName,
      draftNotes: themeMonthItems.draftNotes,
      draftProductUrl: themeMonthItems.draftProductUrl,
      draftTargetAmount: themeMonthItems.draftTargetAmount,
    })
    .from(themeMonthItems)
    .innerJoin(themeYears, eq(themeYears.id, themeMonthItems.themeYearId))
    .where(and(eq(themeMonthItems.id, itemId), eq(themeYears.userId, userId)));

  return row ?? null;
}

export async function getThemePlannerData(userId: string, year: number) {
  const themeYear = await ensureThemeYear(userId, year);
  const settingsRow = await db.query.settings.findFirst({
    where: (settings, { eq: equals }) => equals(settings.userId, userId),
  });

  const rows = await db
    .select({
      id: themeMonthItems.id,
      monthNumber: themeMonthItems.monthNumber,
      position: themeMonthItems.position,
      draftName: themeMonthItems.draftName,
      draftNotes: themeMonthItems.draftNotes,
      draftProductUrl: themeMonthItems.draftProductUrl,
      draftTargetAmount: themeMonthItems.draftTargetAmount,
      giftId: gifts.id,
      giftName: gifts.name,
      giftStatus: gifts.status,
      giftTotalAmount: gifts.totalAmount,
      giftCurrencyCode: gifts.currencyCode,
      giftProductUrl: gifts.productUrl,
      imageId: giftImages.id,
      createdAt: themeMonthItems.createdAt,
    })
    .from(themeMonthItems)
    .leftJoin(gifts, eq(gifts.id, themeMonthItems.giftId))
    .leftJoin(giftImages, eq(giftImages.giftId, gifts.id))
    .where(eq(themeMonthItems.themeYearId, themeYear.id))
    .orderBy(asc(themeMonthItems.monthNumber), asc(themeMonthItems.position), asc(themeMonthItems.createdAt));

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
    .select({ year: themeYears.year })
    .from(themeYears)
    .where(eq(themeYears.userId, userId))
    .orderBy(desc(themeYears.year));

  const months = themeMonthSections.map((section) => ({
    ...section,
    items: rows
      .filter((row) => row.monthNumber === section.monthNumber)
      .map((row) =>
        row.giftId
          ? {
              id: row.id,
              kind: "linked" as const,
              monthNumber: row.monthNumber,
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
              monthNumber: row.monthNumber,
              position: row.position,
              draftName: row.draftName,
              draftNotes: row.draftNotes,
              draftProductUrl: row.draftProductUrl,
              draftTargetAmount: row.draftTargetAmount,
            },
      ),
  }));

  const occasionOptions = plannableOccasionTypes.map((type) => {
    const config = getOccasionConfigByType(type);
    return {
      type,
      slug: config.slug,
      label: config.label,
    };
  });

  return {
    themeYear,
    years: existingYears.map((entry) => entry.year),
    availableGifts,
    months,
    occasionOptions,
  };
}

export async function updateThemeYear(userId: string, year: number, input: UpdateThemeYearInput) {
  const themeYear = await ensureThemeYear(userId, year);

  const [updated] = await db
    .update(themeYears)
    .set({
      name: input.name,
      description: input.description ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(themeYears.id, themeYear.id), eq(themeYears.userId, userId)))
    .returning();

  return updated;
}

export async function createThemeItem(userId: string, year: number, input: CreateThemeItemInput) {
  assertValidMonth(input.monthNumber);

  return db.transaction(async (tx) => {
    const themeYear = await ensureThemeYearRecord(tx, userId, year);

    if (input.giftId) {
      const existingGift = await db.query.gifts.findFirst({
        where: and(eq(gifts.id, input.giftId), eq(gifts.userId, userId)),
      });

      if (!existingGift) {
        throw new Error("Gift not found.");
      }

      const duplicate = await db.query.themeMonthItems.findFirst({
        where: and(eq(themeMonthItems.themeYearId, themeYear.id), eq(themeMonthItems.giftId, input.giftId)),
      });

      if (duplicate) {
        throw new Error("That gift is already part of this yearly theme.");
      }
    }

    const [positionRow] = await db
      .select({ value: max(themeMonthItems.position) })
      .from(themeMonthItems)
      .where(and(eq(themeMonthItems.themeYearId, themeYear.id), eq(themeMonthItems.monthNumber, input.monthNumber)));

    const [created] = await tx
      .insert(themeMonthItems)
      .values({
        themeYearId: themeYear.id,
        monthNumber: input.monthNumber,
        giftId: input.giftId ?? null,
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

export async function updateThemeItem(userId: string, itemId: string, input: UpdateThemeItemInput) {
  const owned = await getOwnedThemeItem(userId, itemId);
  if (!owned) {
    throw new Error("Theme item not found.");
  }

  assertValidMonth(input.monthNumber);

  await db
    .update(themeMonthItems)
    .set({
      monthNumber: input.monthNumber,
      draftName: owned.giftId ? null : input.draftName ?? null,
      draftNotes: owned.giftId ? null : input.draftNotes ?? null,
      draftProductUrl: owned.giftId ? null : input.draftProductUrl ?? null,
      draftTargetAmount: owned.giftId ? null : input.draftTargetAmount ?? null,
      updatedAt: new Date(),
    })
    .where(eq(themeMonthItems.id, itemId));
}

export async function moveThemeItem(userId: string, itemId: string, direction: "up" | "down") {
  const owned = await getOwnedThemeItem(userId, itemId);
  if (!owned) {
    throw new Error("Theme item not found.");
  }

  const candidates = await db
    .select({
      id: themeMonthItems.id,
      monthNumber: themeMonthItems.monthNumber,
      position: themeMonthItems.position,
      createdAt: themeMonthItems.createdAt,
    })
    .from(themeMonthItems)
    .where(eq(themeMonthItems.themeYearId, owned.themeYearId))
    .orderBy(asc(themeMonthItems.position), asc(themeMonthItems.createdAt));

  const monthCandidates = candidates.filter((candidate) => candidate.monthNumber === owned.monthNumber);
  const index = monthCandidates.findIndex((candidate) => candidate.id === itemId);
  const swapWith = direction === "up" ? monthCandidates[index - 1] : monthCandidates[index + 1];

  if (!swapWith) {
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(themeMonthItems)
      .set({
        position: swapWith.position,
        updatedAt: new Date(),
      })
      .where(eq(themeMonthItems.id, owned.itemId));

    await tx
      .update(themeMonthItems)
      .set({
        position: owned.position,
        updatedAt: new Date(),
      })
      .where(eq(themeMonthItems.id, swapWith.id));
  });
}

export async function deleteThemeItem(userId: string, itemId: string) {
  const owned = await getOwnedThemeItem(userId, itemId);
  if (!owned) {
    throw new Error("Theme item not found.");
  }

  await db.delete(themeMonthItems).where(eq(themeMonthItems.id, itemId));
}

export async function promoteThemeItemToGift(userId: string, itemId: string) {
  const owned = await getOwnedThemeItem(userId, itemId);
  if (!owned) {
    throw new Error("Theme item not found.");
  }

  if (owned.giftId) {
    return owned.giftId;
  }

  if (!owned.draftName) {
    throw new Error("Draft ideas need a name before they can become gifts.");
  }

  const settingsRow = await db.query.settings.findFirst({
    where: (settings, { eq: equals }) => equals(settings.userId, userId),
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
      tags: [],
    });

    await tx
      .update(themeMonthItems)
      .set({
        giftId: gift.id,
        draftName: null,
        draftNotes: null,
        draftProductUrl: null,
        draftTargetAmount: null,
        updatedAt: new Date(),
      })
      .where(eq(themeMonthItems.id, itemId));

    return gift;
  });

  return createdGift.id;
}

export async function assignThemeItemToOccasion(
  userId: string,
  itemId: string,
  input: { occasionType: PlannableOccasionType; year: number },
) {
  const owned = await getOwnedThemeItem(userId, itemId);
  if (!owned) {
    throw new Error("Theme item not found.");
  }

  if (!owned.giftId) {
    throw new Error("Promote this draft into a real gift before assigning it to an occasion plan.");
  }

  const settingsRow = await db.query.settings.findFirst({
    where: (settings, { eq: equals }) => equals(settings.userId, userId),
  });
  const sectionKey = getDefaultOccasionSectionKey(input.occasionType, input.year, settingsRow);
  await createOccasionItem(userId, input.occasionType, input.year, {
    sectionKey,
    giftId: owned.giftId,
  });

  return {
    giftId: owned.giftId,
    occasionType: input.occasionType,
    year: input.year,
  };
}
