import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { preferences, settings } from "@/db/schema";
import { auth } from "@/lib/auth";
import { parseSettingsFormData } from "@/lib/forms";
import { settingsInputSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [settingsRow, preferencesRow] = await Promise.all([
    db.query.settings.findFirst({ where: (settings, { eq }) => eq(settings.userId, session.user.id) }),
    db.query.preferences.findFirst({ where: (preferences, { eq }) => eq(preferences.userId, session.user.id) }),
  ]);

  return NextResponse.json({ settings: settingsRow, preferences: preferencesRow });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const payload = settingsInputSchema.safeParse(parseSettingsFormData(formData));

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.issues[0]?.message || "Invalid settings." }, { status: 400 });
  }

  const {
    birthdayMonth,
    birthdayDay,
    anniversaryMonth,
    anniversaryDay,
    anniversaryStartYear,
    timezone,
    defaultCurrencyCode,
    ringSize,
    braceletSize,
    necklaceLength,
    shoeSize,
    clothingSize,
    favoriteColors,
    favoriteBrands,
    doNotBuyItems,
    wishCategories,
  } = payload.data;

  await db.transaction(async (tx) => {
    await tx
      .insert(settings)
      .values({
        userId: session.user.id,
        birthdayMonth,
        birthdayDay,
        anniversaryMonth,
        anniversaryDay,
        anniversaryStartYear,
        timezone,
        defaultCurrencyCode,
      })
      .onConflictDoUpdate({
        target: settings.userId,
        set: {
          birthdayMonth,
          birthdayDay,
          anniversaryMonth,
          anniversaryDay,
          anniversaryStartYear,
          timezone,
          defaultCurrencyCode,
          updatedAt: new Date(),
        },
      });

    await tx
      .insert(preferences)
      .values({
        userId: session.user.id,
        ringSize,
        braceletSize,
        necklaceLength,
        shoeSize,
        clothingSize,
        favoriteColors,
        favoriteBrands,
        doNotBuyItems,
        wishCategories,
      })
      .onConflictDoUpdate({
        target: preferences.userId,
        set: {
          ringSize,
          braceletSize,
          necklaceLength,
          shoeSize,
          clothingSize,
          favoriteColors,
          favoriteBrands,
          doNotBuyItems,
          wishCategories,
          updatedAt: new Date(),
        },
      });
  });

  return NextResponse.json({ ok: true });
}
