import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { uploadGiftImage } from "@/lib/bucket";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Image is required." }, { status: 400 });
  }

  const uploaded = await uploadGiftImage(image);
  return NextResponse.json(uploaded);
}
