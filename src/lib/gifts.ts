import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { giftImages, gifts, giftTags } from "@/db/schema";

type GiftInsertClient = Pick<typeof db, "insert">;

export type CreateGiftInput = {
  userId: string;
  name: string;
  notes?: string | null;
  productUrl?: string | null;
  storeName?: string | null;
  currencyCode: string;
  basePriceAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  status: "IDEA" | "PURCHASED" | "RECEIVED" | "GIVEN";
  isPinned?: boolean;
  isArchived?: boolean;
  isOneOff?: boolean;
  isWrapped?: boolean;
  occasionType?: "BIRTHDAY" | "ANNIVERSARY" | "CHRISTMAS" | "VALENTINES" | "OTHER" | null;
  occasionYear?: number | null;
  purchasedAt?: Date | null;
  receivedAt?: Date | null;
  wrappedAt?: Date | null;
  givenAt?: Date | null;
  tags?: string[];
};

export async function createGiftRecord(tx: GiftInsertClient, input: CreateGiftInput) {
  const [createdGift] = await tx
    .insert(gifts)
    .values({
      userId: input.userId,
      name: input.name,
      notes: input.notes ?? null,
      productUrl: input.productUrl ?? null,
      storeName: input.storeName ?? null,
      currencyCode: input.currencyCode,
      basePriceAmount: input.basePriceAmount,
      taxAmount: input.taxAmount,
      shippingAmount: input.shippingAmount,
      totalAmount: input.totalAmount,
      status: input.status,
      isPinned: input.isPinned ?? false,
      isArchived: input.isArchived ?? false,
      isOneOff: input.isOneOff ?? false,
      isWrapped: input.isWrapped ?? false,
      occasionType: input.occasionType ?? null,
      occasionYear: input.occasionYear ?? null,
      purchasedAt: input.purchasedAt ?? null,
      receivedAt: input.receivedAt ?? null,
      wrappedAt: input.wrappedAt ?? null,
      givenAt: input.givenAt ?? null,
    })
    .returning();

  if (input.tags?.length) {
    await tx.insert(giftTags).values(input.tags.map((tag) => ({ giftId: createdGift.id, tag })));
  }

  return createdGift;
}

export async function listGifts(userId: string) {
  return db
    .select({
      id: gifts.id,
      name: gifts.name,
      status: gifts.status,
      totalAmount: gifts.totalAmount,
      currencyCode: gifts.currencyCode,
      isPinned: gifts.isPinned,
      isArchived: gifts.isArchived,
      createdAt: gifts.createdAt,
      imageId: giftImages.id,
    })
    .from(gifts)
    .leftJoin(giftImages, eq(giftImages.giftId, gifts.id))
    .where(and(eq(gifts.userId, userId), eq(gifts.isArchived, false)))
    .orderBy(desc(gifts.isPinned), desc(gifts.createdAt));
}

export async function getGiftById(userId: string, id: string) {
  const gift = await db.query.gifts.findFirst({
    where: and(eq(gifts.id, id), eq(gifts.userId, userId)),
  });

  if (!gift) {
    return null;
  }

  const image = await db.query.giftImages.findFirst({
    where: eq(giftImages.giftId, gift.id),
  });

  const tags = await db
    .select({ tag: giftTags.tag })
    .from(giftTags)
    .where(eq(giftTags.giftId, gift.id));

  return {
    ...gift,
    image,
    tags: tags.map((tag) => tag.tag),
  };
}
