import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getGiftHistory } from "@/lib/history";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getGiftHistory(session.user.id);
  return NextResponse.json(payload);
}
