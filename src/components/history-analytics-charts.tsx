"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatMinorUnits } from "@/lib/money";

type YearlySpendDatum = {
  year: string;
  amount: number;
  count: number;
};

type MonthlySpendDatum = {
  month: string;
  [year: string]: number | string;
};

function CurrencyTooltip({
  active,
  payload,
  label,
  currencyCode,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
  currencyCode: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      <ul className="plain-list">
        {payload.map((entry) => (
          <li key={`${entry.name}-${entry.color}`} className="chart-tooltip__row">
            <span>{entry.name}</span>
            <strong>{formatMinorUnits(entry.value ?? 0, currencyCode)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function YearlySpendChart({
  data,
  currencyCode,
}: {
  data: YearlySpendDatum[];
  currencyCode: string;
}) {
  return (
    <div className="analytics-chart">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="year" stroke="rgba(230,217,231,0.7)" tickLine={false} axisLine={false} />
          <YAxis
            stroke="rgba(230,217,231,0.7)"
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(value) => formatMinorUnits(value, currencyCode)}
          />
          <Tooltip content={<CurrencyTooltip currencyCode={currencyCode} />} cursor={{ fill: "rgba(240, 93, 168, 0.08)" }} />
          <Bar dataKey="amount" radius={[14, 14, 6, 6]}>
            {data.map((entry, index) => (
              <Cell
                key={entry.year}
                fill={index === data.length - 1 ? "rgba(255, 125, 190, 0.96)" : "rgba(255, 125, 190, 0.52)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlySpendChart({
  data,
  years,
  currencyCode,
}: {
  data: MonthlySpendDatum[];
  years: string[];
  currencyCode: string;
}) {
  const colors = ["rgba(255, 214, 232, 0.52)", "rgba(240, 93, 168, 0.92)"];

  return (
    <div className="analytics-chart">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="month" stroke="rgba(230,217,231,0.7)" tickLine={false} axisLine={false} />
          <YAxis
            stroke="rgba(230,217,231,0.7)"
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(value) => formatMinorUnits(value, currencyCode)}
          />
          <Tooltip content={<CurrencyTooltip currencyCode={currencyCode} />} cursor={{ fill: "rgba(240, 93, 168, 0.08)" }} />
          {years.map((year, index) => (
            <Bar key={year} dataKey={year} name={year} fill={colors[index % colors.length]} radius={[8, 8, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
