import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { giftImages, gifts } from "@/db/schema";

type HistoryRow = {
  id: string;
  name: string;
  totalAmount: number;
  currencyCode: string;
  occasionType: string | null;
  givenAt: Date | null;
  createdAt: Date;
  imageId: string | null;
};

export function groupGiftHistoryRows(rows: HistoryRow[]) {
  const filtered = rows
    .filter((row) => row.givenAt)
    .sort((left, right) => {
      const givenAtDelta = new Date(right.givenAt as Date).getTime() - new Date(left.givenAt as Date).getTime();
      if (givenAtDelta !== 0) {
        return givenAtDelta;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

  const groups = filtered.reduce<Record<string, typeof filtered>>((acc, row) => {
    const year = new Date(row.givenAt as Date).getUTCFullYear().toString();
    acc[year] ??= [];
    acc[year].push(row);
    return acc;
  }, {});

  return Object.entries(groups)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, items]) => ({ year, items }));
}

export async function getGiftHistory(userId: string) {
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

  return groupGiftHistoryRows(rows);
}
