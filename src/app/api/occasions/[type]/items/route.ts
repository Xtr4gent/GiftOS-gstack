import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { parseOccasionItemFormData } from "@/lib/forms";
import { getOccasionConfigBySlug } from "@/lib/occasion-config";
import { createOccasionItem } from "@/lib/occasions";
import { occasionItemCreateSchema } from "@/lib/validation";

function getRequestedYear(url: string) {
  const yearParam = new URL(url).searchParams.get("year");
  const numericYear = Number(yearParam || new Date().getFullYear());
  return Number.isFinite(numericYear) ? numericYear : new Date().getFullYear();
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

  const formData = await request.formData();
  const parsed = occasionItemCreateSchema.safeParse(parseOccasionItemFormData(formData));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid planner item." }, { status: 400 });
  }

  try {
    const year = getRequestedYear(request.url);
    const item = await createOccasionItem(session.user.id, config.type, year, parsed.data);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not add planner item." }, { status: 400 });
  }
}
