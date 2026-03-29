import { notFound } from "next/navigation";

import { GiftForm } from "@/components/gift-form";
import { auth } from "@/lib/auth";
import { getGiftById } from "@/lib/gifts";

export const dynamic = "force-dynamic";

export default async function EditGiftPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const gift = await getGiftById(session!.user.id, id);

  if (!gift) {
    notFound();
  }

  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Edit gift</span>
          <h2>{gift.name}</h2>
        </div>
      </div>
      <section className="card">
        <GiftForm mode="edit" gift={gift} />
      </section>
    </div>
  );
}
