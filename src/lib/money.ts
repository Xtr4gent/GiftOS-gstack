export function parseMoneyToMinorUnits(value: string | null | undefined): number {
  if (!value) return 0;
  const normalized = value.trim();
  if (!normalized) return 0;

  const number = Number(normalized);
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid money value: ${value}`);
  }

  return Math.round(number * 100);
}

export function sumMinorUnits(...values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function formatMinorUnits(value: number, currencyCode = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(value / 100);
}
