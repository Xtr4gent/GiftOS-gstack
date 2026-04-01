import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { parseThemeAssignmentFormData } from "@/lib/forms";
import { assignThemeItemToOccasion } from "@/lib/themes";
import { themeItemAssignSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const parsed = themeItemAssignSchema.safeParse(parseThemeAssignmentFormData(formData));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid occasion assignment." }, { status: 400 });
  }

  try {
    const result = await assignThemeItemToOccasion(session.user.id, id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not assign theme item." }, { status: 400 });
  }
}
