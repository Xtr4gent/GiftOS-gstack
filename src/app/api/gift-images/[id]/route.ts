import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { giftImages, gifts } from "@/db/schema";
import { auth } from "@/lib/auth";
import { readGiftImage } from "@/lib/bucket";

function missingImagePlaceholder() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
  <rect width="96" height="96" rx="20" fill="#221A2C"/>
  <rect x="10" y="10" width="76" height="76" rx="16" fill="#2C2238" stroke="#FF9ED1" stroke-opacity="0.28"/>
  <path d="M32 60L43 49L52 58L64 44L72 52V66H24V60L32 60Z" fill="#F05DA8" fill-opacity="0.38"/>
  <circle cx="36" cy="34" r="6" fill="#FFD6E8" fill-opacity="0.72"/>
</svg>`;
}

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
  if (!asset?.stream) {
    return new NextResponse(missingImagePlaceholder(), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "private, max-age=300, stale-while-revalidate=86400",
      },
    });
  }

  return new NextResponse(asset.stream as BodyInit, {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=604800, immutable",
    },
  });
}
