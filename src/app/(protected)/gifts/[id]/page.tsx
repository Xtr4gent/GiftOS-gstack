import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUserSession } from "@/lib/auth";
import { getGiftById } from "@/lib/gifts";
import { formatMinorUnits } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function GiftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUserSession();
  const { id } = await params;
  const gift = await getGiftById(session.user.id, id);

  if (!gift) {
    notFound();
  }

  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Gift detail</span>
          <h2>{gift.name}</h2>
        </div>
        <Link href={`/gifts/${gift.id}/edit`} className="button-link">
          Edit gift
        </Link>
      </div>
      <section className="card stack">
        {gift.image ? <img src={`/api/gift-images/${gift.image.id}`} alt={gift.name} className="detail-image" /> : null}
        <div className="detail-grid">
          <div>
            <span className="eyebrow">Status</span>
            <p>{gift.status}</p>
          </div>
          <div>
            <span className="eyebrow">Total</span>
            <p>{formatMinorUnits(gift.totalAmount, gift.currencyCode)}</p>
          </div>
          <div>
            <span className="eyebrow">Store</span>
            <p>{gift.storeName || "Not set"}</p>
          </div>
          <div>
            <span className="eyebrow">Occasion</span>
            <p>{gift.occasionType || "Not set"}</p>
          </div>
        </div>
        {gift.productUrl ? (
          <p>
            <a href={gift.productUrl} target="_blank" rel="noreferrer">
              Open product link
            </a>
          </p>
        ) : null}
        <p>{gift.notes || "No notes saved yet."}</p>
        {gift.tags.length ? (
          <div className="tag-row">
            {gift.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
