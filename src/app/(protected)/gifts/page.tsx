import Link from "next/link";

import { requireUserSession } from "@/lib/auth";
import { listGifts } from "@/lib/gifts";
import { formatMinorUnits } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function GiftsPage() {
  const session = await requireUserSession();
  const gifts = await listGifts(session.user.id);

  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">Gift ideas</span>
          <h2>Everything in one place</h2>
        </div>
        <Link href="/gifts/new" className="button-link">
          Add gift
        </Link>
      </div>

      <section className="card">
        {gifts.length ? (
          <ul className="plain-list">
            {gifts.map((gift) => (
              <li key={gift.id} className="gift-row">
                <div className="gift-row__main">
                  {gift.imageId ? <img src={`/api/gift-images/${gift.imageId}`} alt="" className="thumb" /> : <div className="thumb thumb--empty" />}
                  <div>
                    <Link href={`/gifts/${gift.id}`} className="gift-row__title">
                      {gift.name}
                    </Link>
                    <p className="muted">{gift.status}</p>
                  </div>
                </div>
                <strong>{formatMinorUnits(gift.totalAmount, gift.currencyCode)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No gifts saved yet. Add the first one and the app gets interesting fast.</p>
        )}
      </section>
    </div>
  );
}
