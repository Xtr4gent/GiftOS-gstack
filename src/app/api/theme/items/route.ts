import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { parseThemeItemFormData } from "@/lib/forms";
import { createThemeItem } from "@/lib/themes";
import { themeItemCreateSchema } from "@/lib/validation";

function getRequestedYear(url: string) {
  const yearParam = new URL(url).searchParams.get("year");
  const numericYear = Number(yearParam || new Date().getFullYear());
  return Number.isFinite(numericYear) ? numericYear : new Date().getFullYear();
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = themeItemCreateSchema.safeParse(parseThemeItemFormData(formData));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid theme item." }, { status: 400 });
  }

  try {
    const year = getRequestedYear(request.url);
    const item = await createThemeItem(session.user.id, year, parsed.data);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not add theme item." }, { status: 400 });
  }
}
