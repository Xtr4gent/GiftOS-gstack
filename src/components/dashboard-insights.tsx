"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatMinorUnits } from "@/lib/money";

type SpendTrendPoint = {
  month: string;
  amount: number;
};

type PlannerCoverage = {
  label: string;
  itemCount: number;
  linkedCount: number;
  draftCount: number;
  emptySections: number;
};

function SpendTooltip({
  active,
  payload,
  label,
  currencyCode,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  currencyCode: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      <div className="chart-tooltip__row">
        <span>Spend</span>
        <strong>{formatMinorUnits(payload[0]?.value ?? 0, currencyCode)}</strong>
      </div>
    </div>
  );
}

export function DashboardSpendChart({
  data,
  currencyCode,
}: {
  data: SpendTrendPoint[];
  currencyCode: string;
}) {
  return (
    <div className="dashboard-chart">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="dashboardSpendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,125,190,0.88)" />
              <stop offset="100%" stopColor="rgba(255,125,190,0.02)" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="month" stroke="rgba(230,217,231,0.7)" tickLine={false} axisLine={false} />
          <YAxis
            stroke="rgba(230,217,231,0.7)"
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(value) => formatMinorUnits(value, currencyCode)}
          />
          <Tooltip content={<SpendTooltip currencyCode={currencyCode} />} cursor={{ stroke: "rgba(255,125,190,0.24)" }} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="rgba(255,125,190,0.96)"
            strokeWidth={3}
            fill="url(#dashboardSpendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardCoverageList({ coverage }: { coverage: PlannerCoverage[] }) {
  return (
    <div className="dashboard-coverage-list">
      {coverage.map((entry) => {
        const health =
          entry.itemCount === 0
            ? "Empty"
            : entry.emptySections > 0
              ? "Thin"
              : entry.draftCount > entry.linkedCount
                ? "Draft-heavy"
                : "Healthy";

        return (
          <article key={entry.label} className="dashboard-coverage-card">
            <div>
              <span className="eyebrow">{entry.label}</span>
              <h4>{health}</h4>
            </div>
            <p className="muted">
              {entry.itemCount} ideas, {entry.linkedCount} linked, {entry.draftCount} drafts
              {entry.emptySections ? `, ${entry.emptySections} empty lanes` : ""}.
            </p>
          </article>
        );
      })}
    </div>
  );
}
