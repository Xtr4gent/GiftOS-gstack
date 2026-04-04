import Image from "next/image";

import { MonthlySpendChart, YearlySpendChart } from "@/components/history-analytics-charts";
import { requireUserSession } from "@/lib/auth";
import { getGiftHistory } from "@/lib/history";
import { formatMinorUnits } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await requireUserSession();
  const { groups, analytics } = await getGiftHistory(session.user.id);
  const currencyCode =
    groups.flatMap((group) => group.items).find((item) => item.currencyCode)?.currencyCode ?? "USD";
  const monthYears = analytics.yearlySpend.slice(-2).map((entry) => entry.year);

  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <span className="eyebrow">History</span>
          <h2>What has already happened</h2>
        </div>
      </div>

      <section className="card-grid history-summary-grid">
        <article className="card">
          <span className="eyebrow">Lifetime spend</span>
          <h3>{formatMinorUnits(analytics.summary.totalLifetimeSpend, currencyCode)}</h3>
          <p className="muted">{analytics.summary.totalGiftCount} given gifts across the whole relationship timeline.</p>
        </article>
        <article className="card">
          <span className="eyebrow">Average gift</span>
          <h3>{formatMinorUnits(analytics.summary.averageGiftSpend, currencyCode)}</h3>
          <p className="muted">A quick gut-check for whether the next idea feels meaningfully bigger or smaller than usual.</p>
        </article>
        <article className="card">
          <span className="eyebrow">Year over year</span>
          <h3>
            {analytics.summary.yearOverYearDelta === null
              ? "Open"
              : `${analytics.summary.yearOverYearDelta > 0 ? "+" : ""}${analytics.summary.yearOverYearDelta}%`}
          </h3>
          <p className="muted">
            {analytics.summary.yearOverYearDelta === null
              ? "You need at least two active gift years before this comparison becomes real."
              : `${formatMinorUnits(analytics.summary.currentYearSpend, currencyCode)} this year vs ${formatMinorUnits(
                  analytics.summary.previousYearSpend,
                  currencyCode,
                )} last year.`}
          </p>
        </article>
        <article className="card">
          <span className="eyebrow">Cadence</span>
          <h3>{analytics.cadence.averageDaysBetween ? `${analytics.cadence.averageDaysBetween} days` : "Open"}</h3>
          <p className="muted">
            {analytics.cadence.averageDaysBetween
              ? `Average gap between gifts, with a recent rhythm of ${analytics.cadence.mostRecentGapDays ?? "?"} days.`
              : "Once more gifts are given, the page will show how often meaningful moments actually happen."}
          </p>
        </article>
      </section>

      <section className="card stack">
        <div className="section-head">
          <div>
            <span className="eyebrow">Analytics</span>
            <h3>Patterns worth acting on</h3>
          </div>
          <p className="muted">Use the charts for shape, then read the breakdowns for what they mean.</p>
        </div>

        <div className="analytics-layout">
          <article className="card card--nested stack">
            <div>
              <span className="eyebrow">Yearly spend</span>
              <h4>How the years compare</h4>
            </div>
            <YearlySpendChart data={analytics.yearlySpend} currencyCode={currencyCode} />
          </article>

          <article className="card card--nested stack">
            <div>
              <span className="eyebrow">Month pattern</span>
              <h4>Where the year actually clusters</h4>
            </div>
            <MonthlySpendChart data={analytics.monthlySpend} years={monthYears} currencyCode={currencyCode} />
          </article>

          <article className="card card--nested stack">
            <div>
              <span className="eyebrow">Occasion mix</span>
              <h4>What kinds of moments are carrying the spend</h4>
            </div>
            <div className="analytics-bars">
              {analytics.occasionBreakdown.map((entry) => {
                const maxAmount = analytics.occasionBreakdown[0]?.amount || 1;
                const width = `${Math.max(14, Math.round((entry.amount / maxAmount) * 100))}%`;

                return (
                  <div key={entry.label} className="analytics-bar-row">
                    <div className="analytics-bar-row__label">
                      <strong>{entry.label}</strong>
                      <span className="muted">{entry.count} gifts</span>
                    </div>
                    <div className="analytics-bar-row__track">
                      <div className="analytics-bar-row__fill" style={{ width }} />
                    </div>
                    <strong>{formatMinorUnits(entry.amount, currencyCode)}</strong>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="card card--nested stack">
            <div>
              <span className="eyebrow">Recurring tags</span>
              <h4>Directions that keep showing up</h4>
            </div>
            <div className="analytics-tag-list">
              {analytics.tagPatterns.length ? (
                analytics.tagPatterns.map((entry) => (
                  <article key={entry.tag} className="analytics-tag-card">
                    <div>
                      <strong>{entry.tag}</strong>
                      <p className="muted">{entry.count} gifts</p>
                    </div>
                    <strong>{formatMinorUnits(entry.amount, currencyCode)}</strong>
                  </article>
                ))
              ) : (
                <p className="muted">Tags will become useful here once more gifts are tagged and marked as given.</p>
              )}
            </div>
          </article>
        </div>
      </section>

      {groups.length ? (
        groups.map((group) => (
          <section key={group.year} className="card">
            <h3>{group.year}</h3>
            <ul className="plain-list">
              {group.items.map((gift) => (
                <li key={gift.id} className="gift-row">
                  <div className="gift-row__main">
                    {gift.imageId ? (
                      <Image
                        src={`/api/gift-images/${gift.imageId}`}
                        alt=""
                        className="thumb"
                        width={64}
                        height={64}
                        sizes="64px"
                        loading="lazy"
                        unoptimized
                      />
                    ) : (
                      <div className="thumb thumb--empty" />
                    )}
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
