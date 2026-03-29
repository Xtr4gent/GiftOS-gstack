import { auth } from "@/lib/auth";
import { getGiftHistory } from "@/lib/history";
import { formatMinorUnits } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await auth();
  const history = await getGiftHistory(session!.user.id);

  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">History</span>
          <h2>What has already happened</h2>
        </div>
      </div>
      {history.length ? (
        history.map((group) => (
          <section key={group.year} className="card">
            <h3>{group.year}</h3>
            <ul className="plain-list">
              {group.items.map((gift) => (
                <li key={gift.id} className="gift-row">
                  <div className="gift-row__main">
                    {gift.imageId ? <img src={`/api/gift-images/${gift.imageId}`} alt="" className="thumb" /> : <div className="thumb thumb--empty" />}
                    <div>
                      <strong>{gift.name}</strong>
                      <p className="muted">{gift.occasionType || "No occasion"}</p>
                    </div>
                  </div>
                  <strong>{formatMinorUnits(gift.totalAmount, gift.currencyCode)}</strong>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <section className="card">
          <p className="muted">Nothing has been marked as given yet, so history is still empty.</p>
        </section>
      )}
    </div>
  );
}
