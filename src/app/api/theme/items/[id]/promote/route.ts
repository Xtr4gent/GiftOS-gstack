import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { promoteThemeItemToGift } from "@/lib/themes";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const giftId = await promoteThemeItemToGift(session.user.id, id);
    return NextResponse.json({ giftId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not promote theme item." }, { status: 400 });
  }
}
