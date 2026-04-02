import { notFound } from "next/navigation";

import { OccasionPlanner } from "@/components/occasion-planner";
import { requireUserSession } from "@/lib/auth";
import { getOccasionConfigBySlug } from "@/lib/occasion-config";
import { getOccasionPlannerData } from "@/lib/occasions";

export const dynamic = "force-dynamic";

export default async function OccasionPlannerPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await requireUserSession();
  const { type } = await params;
  const { year } = await searchParams;
  const config = getOccasionConfigBySlug(type);

  if (!config) {
    notFound();
  }

  const requestedYear = Number(year || new Date().getFullYear());
  const planner = await getOccasionPlannerData(
    session.user.id,
    config.type,
    Number.isFinite(requestedYear) ? requestedYear : new Date().getFullYear(),
  );

  return (
    <OccasionPlanner
      typeSlug={config.slug}
      year={planner.plan.year}
      plan={planner.plan}
      config={planner.config}
      years={planner.years}
      availableGifts={planner.availableGifts}
      sections={planner.sections}
      guide={planner.guide}
      recommendationHints={planner.recommendationHints}
    />
  );
}
