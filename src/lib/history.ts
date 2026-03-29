import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { giftImages, gifts } from "@/db/schema";

export async function getGiftHistory(userId: string) {
  const rows = await db
    .select({
      id: gifts.id,
      name: gifts.name,
      totalAmount: gifts.totalAmount,
      currencyCode: gifts.currencyCode,
      occasionType: gifts.occasionType,
      givenAt: gifts.givenAt,
      imageId: giftImages.id,
    })
    .from(gifts)
    .leftJoin(giftImages, eq(giftImages.giftId, gifts.id))
    .where(eq(gifts.userId, userId))
    .orderBy(asc(gifts.givenAt));

  const filtered = rows.filter((row) => row.givenAt);
  const groups = filtered.reduce<Record<string, typeof filtered>>((acc, row) => {
    const year = new Date(row.givenAt as Date).getUTCFullYear().toString();
    acc[year] ??= [];
    acc[year].push(row);
    return acc;
  }, {});

  return Object.entries(groups)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, items]) => ({ year, items: items.reverse() }));
}
