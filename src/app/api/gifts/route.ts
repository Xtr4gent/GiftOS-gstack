import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { giftImages } from "@/db/schema";
import { auth } from "@/lib/auth";
import { uploadGiftImage } from "@/lib/bucket";
import { parseGiftFormData } from "@/lib/forms";
import { createGiftRecord, listGifts } from "@/lib/gifts";
import { giftInputSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await listGifts(session.user.id));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = giftInputSchema.safeParse(parseGiftFormData(formData));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid gift." }, { status: 400 });
  }

  const image = formData.get("image");
  let uploadedImage: Awaited<ReturnType<typeof uploadGiftImage>> | null = null;

  if (image instanceof File && image.size > 0) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(image.type)) {
      return NextResponse.json({ error: "Only PNG, JPEG, and WEBP images are supported." }, { status: 400 });
    }

    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Images must be 5MB or smaller." }, { status: 400 });
    }

    uploadedImage = await uploadGiftImage(image);
  }

  const gift = await db.transaction(async (tx) => {
    const createdGift = await createGiftRecord(tx, {
      userId: session.user.id,
      ...parsed.data,
      purchasedAt: parsed.data.purchasedAt ? new Date(parsed.data.purchasedAt) : null,
      receivedAt: parsed.data.receivedAt ? new Date(parsed.data.receivedAt) : null,
      wrappedAt: parsed.data.wrappedAt ? new Date(parsed.data.wrappedAt) : null,
      givenAt: parsed.data.givenAt ? new Date(parsed.data.givenAt) : null,
    });

    if (uploadedImage) {
      await tx.insert(giftImages).values({
        giftId: createdGift.id,
        bucketKey: uploadedImage.key,
        originalFilename: uploadedImage.originalFilename,
        mimeType: uploadedImage.mimeType,
        byteSize: uploadedImage.byteSize,
      });
    }

    return createdGift;
  });

  return NextResponse.json(gift, { status: 201 });
}
