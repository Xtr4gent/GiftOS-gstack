import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { parseOccasionYearFormData } from "@/lib/forms";
import { getOccasionConfigBySlug } from "@/lib/occasion-config";
import { ensureOccasionYear, getOccasionPlannerData, updateOccasionYear } from "@/lib/occasions";
import { occasionYearUpdateSchema } from "@/lib/validation";

function getRequestedYear(url: string) {
  const yearParam = new URL(url).searchParams.get("year");
  const numericYear = Number(yearParam || new Date().getFullYear());
  return Number.isFinite(numericYear) ? numericYear : new Date().getFullYear();
}

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await params;
  const config = getOccasionConfigBySlug(type);

  if (!config) {
    return NextResponse.json({ error: "Occasion not found." }, { status: 404 });
  }

  const year = getRequestedYear(request.url);
  return NextResponse.json(await getOccasionPlannerData(session.user.id, config.type, year));
}

export async function POST(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await params;
  const config = getOccasionConfigBySlug(type);

  if (!config) {
    return NextResponse.json({ error: "Occasion not found." }, { status: 404 });
  }

  const year = getRequestedYear(request.url);
  return NextResponse.json(await ensureOccasionYear(session.user.id, config.type, year), { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await params;
  const config = getOccasionConfigBySlug(type);

  if (!config) {
    return NextResponse.json({ error: "Occasion not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const parsed = occasionYearUpdateSchema.safeParse(parseOccasionYearFormData(formData));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid occasion plan update." }, { status: 400 });
  }

  try {
    const year = getRequestedYear(request.url);
    return NextResponse.json(await updateOccasionYear(session.user.id, config.type, year, parsed.data));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update occasion plan." },
      { status: 400 },
    );
  }
}
