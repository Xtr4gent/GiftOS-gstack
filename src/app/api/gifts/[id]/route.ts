import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { giftImages, gifts, giftTags } from "@/db/schema";
import { auth } from "@/lib/auth";
import { uploadGiftImage } from "@/lib/bucket";
import { parseGiftFormData } from "@/lib/forms";
import { getGiftById } from "@/lib/gifts";
import { giftInputSchema } from "@/lib/validation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const gift = await getGiftById(session.user.id, id);
  if (!gift) {
    return NextResponse.json({ error: "Gift not found." }, { status: 404 });
  }

  return NextResponse.json(gift);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getGiftById(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Gift not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const parsed = giftInputSchema.safeParse(parseGiftFormData(formData));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid gift." }, { status: 400 });
  }

  const image = formData.get("image");
  let uploadedImage: Awaited<ReturnType<typeof uploadGiftImage>> | null = null;

  if (image instanceof File && image.size > 0) {
    uploadedImage = await uploadGiftImage(image);
  }

  await db.transaction(async (tx) => {
    await tx
      .update(gifts)
      .set({
        ...parsed.data,
        purchasedAt: parsed.data.purchasedAt ? new Date(parsed.data.purchasedAt) : null,
        receivedAt: parsed.data.receivedAt ? new Date(parsed.data.receivedAt) : null,
        wrappedAt: parsed.data.wrappedAt ? new Date(parsed.data.wrappedAt) : null,
        givenAt: parsed.data.givenAt ? new Date(parsed.data.givenAt) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(gifts.id, id), eq(gifts.userId, session.user.id)));

    await tx.delete(giftTags).where(eq(giftTags.giftId, id));

    if (parsed.data.tags.length) {
      await tx.insert(giftTags).values(parsed.data.tags.map((tag) => ({ giftId: id, tag })));
    }

    if (uploadedImage) {
      await tx.delete(giftImages).where(eq(giftImages.giftId, id));
      await tx.insert(giftImages).values({
        giftId: id,
        bucketKey: uploadedImage.key,
        originalFilename: uploadedImage.originalFilename,
        mimeType: uploadedImage.mimeType,
        byteSize: uploadedImage.byteSize,
      });
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getGiftById(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Gift not found." }, { status: 404 });
  }

  await db.delete(gifts).where(and(eq(gifts.id, id), eq(gifts.userId, session.user.id)));
  return NextResponse.json({ ok: true });
}
