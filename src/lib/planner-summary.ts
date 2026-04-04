type PlannerSummaryVariant = "default" | "christmas" | "birthday" | "valentines";

type PlannerSummarySection = {
  key: string;
  label: string;
  itemCount: number;
};

export type PlannerSummaryCard = {
  eyebrow: string;
  value: string;
  body: string;
};

export type PlannerSummary = {
  variant: Exclude<PlannerSummaryVariant, "default">;
  eyebrow: string;
  title: string;
  description: string;
  cards: PlannerSummaryCard[];
};

type BuildPlannerSummaryInput = {
  variant: PlannerSummaryVariant;
  themeName?: string | null;
  sections: PlannerSummarySection[];
};

function findCount(sections: PlannerSummarySection[], key: string) {
  return sections.find((section) => section.key === key)?.itemCount ?? 0;
}

function getValentinePulse(gestureCount: number, extrasCount: number) {
  if (gestureCount === 0 && extrasCount === 0) {
    return {
      value: "Open",
      body: "Nothing is locked yet. Start with one main gesture before the little touches crowd the page.",
    };
  }

  if (gestureCount === 0 && extrasCount > 0) {
    return {
      value: "Needs anchor",
      body: "The sweet extras are forming, but the day still needs one clear main gesture to keep it from feeling random.",
    };
  }

  if (gestureCount === 1 && extrasCount <= 3) {
    return {
      value: "Balanced",
      body: "Good shape. One clear main idea with a few extras is usually exactly the right Valentine's rhythm.",
    };
  }

  if (gestureCount > 1) {
    return {
      value: "Choose one",
      body: "Too many main gestures can flatten the occasion. Try resolving this lane down to the clearest one.",
    };
  }

  return {
    value: "Layer extras",
    body: "The main gesture exists. Add one or two easy extras if you want the day to feel fuller without getting noisy.",
  };
}

export function buildPlannerSummary(input: BuildPlannerSummaryInput): PlannerSummary | null {
  if (input.variant === "default") {
    return null;
  }

  if (input.variant === "christmas") {
    const stockingCount = findCount(input.sections, "stocking");
    const mainCount = findCount(input.sections, "main");
    const totalCount = input.sections.reduce((sum, section) => sum + section.itemCount, 0);

    return {
      variant: "christmas",
      eyebrow: "Holiday rhythm",
      title: "Balance the little wins with the headliners",
      description:
        "Let the stocking feel layered and playful. Keep the main gifts fewer, clearer, and worth waking up for.",
      cards: [
        {
          eyebrow: "Stuffers",
          value: String(stockingCount),
          body: "Easy little wins that make the stocking feel full.",
        },
        {
          eyebrow: "Main gifts",
          value: String(mainCount),
          body: "Bigger gifts worth protecting space and budget for.",
        },
        {
          eyebrow: "Plan mix",
          value: String(totalCount),
          body: "A clean Christmas plan should feel intentional, not endless.",
        },
      ],
    };
  }

  if (input.variant === "birthday") {
    const headlineCount = findCount(input.sections, "headline");
    const supportingCount = findCount(input.sections, "supporting");

    return {
      variant: "birthday",
      eyebrow: "Birthday framing",
      title: "Give this year a vibe before you fill the page",
      description:
        "A short theme keeps the birthday from turning into a random list. One clear headline gift should lead, then the supporting layer can echo it.",
      cards: [
        {
          eyebrow: "Headline lane",
          value: String(headlineCount),
          body:
            headlineCount === 1
              ? "Good. One clear main gift is exactly the right shape."
              : headlineCount > 1
                ? "This lane should usually resolve to one clear main gift."
                : "Empty is fine for now, but this lane should eventually hold the birthday anchor.",
        },
        {
          eyebrow: "Supporting ideas",
          value: String(supportingCount),
          body: "Cards, extras, small surprises, or add-ons that reinforce the main idea.",
        },
        {
          eyebrow: "This year's vibe",
          value: input.themeName?.trim() || "Open",
          body: input.themeName
            ? "Use the theme to decide whether a new idea belongs in the headline lane or just supports it."
            : "Save a short theme once the mood of the birthday becomes clear.",
        },
      ],
    };
  }

  const gestureCount = findCount(input.sections, "gesture");
  const extrasCount = findCount(input.sections, "extras");
  const pulse = getValentinePulse(gestureCount, extrasCount);

  return {
    variant: "valentines",
    eyebrow: "Romantic dashboard",
    title: "Make the big gesture feel chosen, not rushed",
    description:
      "Let one stronger idea lead, then use the little extras to soften the edges and make the day feel considered.",
    cards: [
      {
        eyebrow: "Main gesture",
        value: String(gestureCount),
        body:
          gestureCount === 1
            ? "Good. One clear anchor gives the day shape."
            : gestureCount > 1
              ? "This lane works best when it resolves to one unmistakable main idea."
              : "Start here. The page gets much easier once one real anchor exists.",
      },
      {
        eyebrow: "Sweet extras",
        value: String(extrasCount),
        body: "Small touches, flowers, notes, treats, or easy add-ons that make the plan feel warmer.",
      },
      {
        eyebrow: "Plan pulse",
        value: pulse.value,
        body: pulse.body,
      },
      {
        eyebrow: "Next move",
        value: gestureCount === 0 ? "Pick the anchor" : extrasCount === 0 ? "Add 1-2 extras" : "Tighten the mix",
        body:
          gestureCount === 0
            ? "Choose the one gesture that carries the day before you spend energy on details."
            : extrasCount === 0
              ? "The main idea is there. Add one or two easy sweet extras if you want the day to feel fuller."
              : "If the plan feels busy, cut anything that does not support the main gesture.",
      },
    ],
  };
}
