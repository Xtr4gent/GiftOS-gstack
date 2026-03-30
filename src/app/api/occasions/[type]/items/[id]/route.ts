import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { parseOccasionItemFormData } from "@/lib/forms";
import { deleteOccasionItem, moveOccasionItem, updateOccasionItem } from "@/lib/occasions";
import { occasionItemUpdateSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const action = formData.get("action")?.toString();

  try {
    if (action === "move-up" || action === "move-down") {
      await moveOccasionItem(session.user.id, id, action === "move-up" ? "up" : "down");
      return NextResponse.json({ ok: true });
    }

    const parsed = occasionItemUpdateSchema.safeParse(parseOccasionItemFormData(formData));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid planner item." }, { status: 400 });
    }

    await updateOccasionItem(session.user.id, id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update planner item." }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteOccasionItem(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not remove planner item." }, { status: 400 });
  }
}
