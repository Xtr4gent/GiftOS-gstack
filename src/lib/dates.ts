export type OccasionCountdown = {
  label: string;
  isoDate: string;
  daysRemaining: number;
};

function nextDateFor(month: number, day: number, timezone: string, startYear?: number) {
  const now = new Date();
  const year = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
    }).format(now),
  );

  const candidate = new Date(Date.UTC(year, month - 1, day));
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-");
  const todayUtc = Date.UTC(Number(todayParts[0]), Number(todayParts[1]) - 1, Number(todayParts[2]));
  let targetYear = year;

  if (candidate.getTime() < todayUtc) {
    targetYear += 1;
  }

  if (startYear && targetYear < startYear) {
    targetYear = startYear;
  }

  return new Date(Date.UTC(targetYear, month - 1, day));
}

export function daysUntil(date: Date): number {
  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Math.ceil((date.getTime() - now.getTime()) / oneDayMs);
}

/*
Countdown derivation
====================
settings -> next birthday date
         -> next anniversary date
         -> compare daysRemaining
         -> choose smallest non-negative event
*/
export function getUpcomingOccasions(input: {
  birthdayMonth?: number | null;
  birthdayDay?: number | null;
  anniversaryMonth?: number | null;
  anniversaryDay?: number | null;
  anniversaryStartYear?: number | null;
  timezone: string;
}): OccasionCountdown[] {
  const occasions: OccasionCountdown[] = [];

  if (input.birthdayMonth && input.birthdayDay) {
    const date = nextDateFor(input.birthdayMonth, input.birthdayDay, input.timezone);
    occasions.push({
      label: "Birthday",
      isoDate: date.toISOString(),
      daysRemaining: daysUntil(date),
    });
  }

  if (input.anniversaryMonth && input.anniversaryDay) {
    const date = nextDateFor(
      input.anniversaryMonth,
      input.anniversaryDay,
      input.timezone,
      input.anniversaryStartYear ?? undefined,
    );
    occasions.push({
      label: "Anniversary",
      isoDate: date.toISOString(),
      daysRemaining: daysUntil(date),
    });
  }

  return occasions.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
