import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { parseThemeYearFormData } from "@/lib/forms";
import { ensureThemeYear, getThemePlannerData, updateThemeYear } from "@/lib/themes";
import { themeYearUpdateSchema } from "@/lib/validation";

function getRequestedYear(url: string) {
  const yearParam = new URL(url).searchParams.get("year");
  const numericYear = Number(yearParam || new Date().getFullYear());
  return Number.isFinite(numericYear) ? numericYear : new Date().getFullYear();
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = getRequestedYear(request.url);
  return NextResponse.json(await getThemePlannerData(session.user.id, year));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = getRequestedYear(request.url);
  return NextResponse.json(await ensureThemeYear(session.user.id, year), { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = themeYearUpdateSchema.safeParse(parseThemeYearFormData(formData));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid yearly theme." }, { status: 400 });
  }

  try {
    const year = getRequestedYear(request.url);
    const updated = await updateThemeYear(session.user.id, year, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update yearly theme." }, { status: 400 });
  }
}
