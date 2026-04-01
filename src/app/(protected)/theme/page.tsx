import { ThemeYearPlanner } from "@/components/theme-year-planner";
import { requireUserSession } from "@/lib/auth";
import { getThemePlannerData } from "@/lib/themes";

export const dynamic = "force-dynamic";

export default async function ThemeYearPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await requireUserSession();
  const { year } = await searchParams;
  const requestedYear = Number(year || new Date().getFullYear());
  const planner = await getThemePlannerData(
    session.user.id,
    Number.isFinite(requestedYear) ? requestedYear : new Date().getFullYear(),
  );

  return (
    <ThemeYearPlanner
      year={planner.themeYear.year}
      years={planner.years}
      themeYear={planner.themeYear}
      availableGifts={planner.availableGifts}
      months={planner.months}
      occasionOptions={planner.occasionOptions}
    />
  );
}
