import Link from "next/link";

import { DashboardCoverageList, DashboardSpendChart } from "@/components/dashboard-insights";
import { requireUserSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { formatMinorUnits } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireUserSession();
  const data = await getDashboardData(session.user.id);
  const currencyCode = data.settings?.defaultCurrencyCode ?? "USD";

  return (
    <div className="stack">
      <section className="hero-card dashboard-hero">
        <div>
          <span className="eyebrow">Next up</span>
          <h2>{data.nextOccasion?.label ?? "Set up dates in settings"}</h2>
          <p>
            {data.nextOccasion
              ? `${data.nextOccasion.daysRemaining} day(s) remaining, with ${data.upcomingOccasions.length} upcoming occasion${data.upcomingOccasions.length === 1 ? "" : "s"} on the board.`
              : "The dashboard gets smarter once birthday and anniversary dates are saved."}
          </p>
        </div>
        <div className="dashboard-hero__metrics">
          <article className="card card--nested">
            <span className="eyebrow">Year to date</span>
            <h3>{formatMinorUnits(data.yearToDateSpend, currencyCode)}</h3>
          </article>
          <article className="card card--nested">
            <span className="eyebrow">Last gift given</span>
            <h3>{data.lastGiftGiven?.name ?? "Nothing given yet"}</h3>
          </article>
        </div>
      </section>

      <section className="card-grid dashboard-top-grid">
        <article className="card">
          <div className="section-head">
            <div>
              <span className="eyebrow">Upcoming occasions</span>
              <h3>What is coming next</h3>
            </div>
          </div>
          {data.upcomingOccasions.length ? (
            <ul className="plain-list">
              {data.upcomingOccasions.map((occasion) => (
                <li key={`${occasion.label}-${occasion.isoDate}`} className="list-row">
                  <span>{occasion.label}</span>
                  <strong>{occasion.daysRemaining} day(s)</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Add birthday and anniversary dates in settings to unlock countdowns.</p>
          )}
        </article>

        <article className="card">
          <div className="section-head">
            <div>
              <span className="eyebrow">Recent gifts</span>
              <h3>What you touched most recently</h3>
            </div>
            <Link href="/gifts" prefetch={false} className="button-link button-link--quiet">
              View all gifts
            </Link>
          </div>
          {data.recentGifts.length ? (
            <ul className="plain-list">
              {data.recentGifts.map((gift) => (
                <li key={gift.id} className="list-row">
                  <div>
                    <strong>{gift.name}</strong>
                    <p className="muted">{gift.status}</p>
                  </div>
                  <strong>{formatMinorUnits(gift.totalAmount, gift.currencyCode)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Once you add a few gifts, the dashboard starts feeling alive.</p>
          )}
        </article>
      </section>

      <section className="card dashboard-planning">
        <div className="section-head">
          <div>
            <span className="eyebrow">Planner coverage</span>
            <h3>Where the plans look thin</h3>
          </div>
        </div>
        {data.plannerCoverage.length ? (
          <DashboardCoverageList coverage={data.plannerCoverage} />
        ) : (
          <p className="muted">Once occasion plans exist for this year, their coverage will show up here.</p>
        )}
      </section>

      <section className="card dashboard-insights-grid">
        <article className="card card--nested stack">
          <div className="section-head">
            <div>
              <span className="eyebrow">Spend trend</span>
              <h3>How this year is pacing</h3>
            </div>
          </div>
          <DashboardSpendChart data={data.spendTrend} currencyCode={currencyCode} />
        </article>

        <article className="card card--nested stack">
          <div className="section-head">
            <div>
              <span className="eyebrow">Pattern hints</span>
              <h3>Quiet signals from the recent history</h3>
            </div>
          </div>
          {data.recommendationHints.length ? (
            <div className="recommendation-grid">
              {data.recommendationHints.map((hint) => (
                <article key={`${hint.type}-${hint.title}`} className="recommendation-card">
                  <span className="eyebrow">{hint.type.replace("-", " ")}</span>
                  <h4>{hint.title}</h4>
                  <p className="muted">{hint.reason}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">Once you build up more gift history, this area will start nudging you away from repeats and toward stronger directions.</p>
          )}

          <div className="dashboard-pattern-summary">
            <article className="dashboard-pattern-card">
              <span className="eyebrow">Lifetime spend</span>
              <strong>{formatMinorUnits(data.historyAnalytics.summary.totalLifetimeSpend, currencyCode)}</strong>
            </article>
            <article className="dashboard-pattern-card">
              <span className="eyebrow">Average gift</span>
              <strong>{formatMinorUnits(data.historyAnalytics.summary.averageGiftSpend, currencyCode)}</strong>
            </article>
            <article className="dashboard-pattern-card">
              <span className="eyebrow">Tag direction</span>
              <strong>{data.historyAnalytics.tagPatterns[0]?.tag ?? "Open"}</strong>
            </article>
          </div>
        </article>
      </section>
    </div>
  );
}
