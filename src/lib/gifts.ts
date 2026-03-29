import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { giftImages, gifts, giftTags } from "@/db/schema";

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
