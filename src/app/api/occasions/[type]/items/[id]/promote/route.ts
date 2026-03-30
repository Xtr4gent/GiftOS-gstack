import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { promoteOccasionItemToGift } from "@/lib/occasions";

export async function POST(_: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const giftId = await promoteOccasionItemToGift(session.user.id, id);
    return NextResponse.json({ giftId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not promote planner item." }, { status: 400 });
  }
}
