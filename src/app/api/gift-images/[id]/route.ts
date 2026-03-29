import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { giftImages, gifts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { readGiftImage } from "@/lib/bucket";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const image = await db
    .select({
      id: giftImages.id,
      bucketKey: giftImages.bucketKey,
      mimeType: giftImages.mimeType,
      userId: gifts.userId,
    })
    .from(giftImages)
    .innerJoin(gifts, eq(gifts.id, giftImages.giftId))
    .where(eq(giftImages.id, id))
    .then((rows) => rows[0]);

  if (!image || image.userId !== session.user.id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const asset = await readGiftImage(image.bucketKey);
  return new NextResponse(asset.stream as BodyInit, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=60",
    },
  });
}
