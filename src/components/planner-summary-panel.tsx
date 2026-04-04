import type { ReactNode } from "react";

import type { PlannerSummary } from "@/lib/planner-summary";

export function PlannerSummaryPanel({
  summary,
  children,
}: {
  summary: PlannerSummary;
  children?: ReactNode;
}) {
  return (
    <section className={`card planner-summary planner-summary--${summary.variant}`}>
      <div className="section-head">
        <div>
          <span className="eyebrow">{summary.eyebrow}</span>
          <h3>{summary.title}</h3>
        </div>
        <p className="muted">{summary.description}</p>
      </div>
      {children}
      <div className="card-grid planner-summary__grid">
        {summary.cards.map((card) => (
          <article key={card.eyebrow} className="card card--nested planner-summary__card">
            <span className="eyebrow">{card.eyebrow}</span>
            <h4>{card.value}</h4>
            <p className="muted">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
