import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { formatMinorUnits } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData(session!.user.id);

  return (
    <div className="stack">
      <section className="hero-card">
        <span className="eyebrow">Next up</span>
        <h2>{data.nextOccasion?.label ?? "Set up dates in settings"}</h2>
        <p>
          {data.nextOccasion
            ? `${data.nextOccasion.daysRemaining} day(s) remaining`
            : "The dashboard gets smarter once birthday and anniversary dates are saved."}
        </p>
      </section>

      <section className="card-grid">
        <article className="card">
          <span className="eyebrow">Year to date</span>
          <h3>{formatMinorUnits(data.yearToDateSpend, data.settings?.defaultCurrencyCode ?? "USD")}</h3>
        </article>
        <article className="card">
          <span className="eyebrow">Last gift given</span>
          <h3>{data.lastGiftGiven?.name ?? "Nothing given yet"}</h3>
        </article>
        <article className="card">
          <span className="eyebrow">Timezone</span>
          <h3>{data.settings?.timezone ?? "Not set"}</h3>
        </article>
      </section>

      <section className="card">
        <div className="section-head">
          <h3>Upcoming occasions</h3>
        </div>
        {data.upcomingOccasions.length ? (
          <ul className="plain-list">
            {data.upcomingOccasions.map((occasion) => (
              <li key={occasion.label} className="list-row">
                <span>{occasion.label}</span>
                <strong>{occasion.daysRemaining} day(s)</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Add birthday and anniversary dates in settings to unlock countdowns.</p>
        )}
      </section>
    </div>
  );
}
