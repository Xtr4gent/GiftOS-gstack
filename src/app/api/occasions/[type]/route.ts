import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getOccasionConfigBySlug } from "@/lib/occasion-config";
import { ensureOccasionYear, getOccasionPlannerData } from "@/lib/occasions";

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
