import type { settings } from "@/db/schema";

export const plannableOccasionTypes = ["BIRTHDAY", "ANNIVERSARY", "CHRISTMAS", "VALENTINES"] as const;
export type PlannableOccasionType = (typeof plannableOccasionTypes)[number];

export type OccasionSection = {
  key: string;
  label: string;
  description: string;
};

type SettingsRow = typeof settings.$inferSelect | null | undefined;

export type AnniversaryGuide = {
  anniversaryNumber: number | null;
  traditional: string;
  modern: string;
  gemstone: string;
};

export type OccasionConfig = {
  type: PlannableOccasionType;
  slug: string;
  label: string;
  shortLabel: string;
  eyebrow: string;
  description: string;
  plannerHeadline: string;
  sections: OccasionSection[];
  addDraftLabel: string;
};

type BaseOccasionConfig = Omit<OccasionConfig, "sections" | "plannerHeadline"> & {
  defaultPlannerHeadline: string;
  defaultSections: OccasionSection[];
};

const anniversaryGuideByYear: Record<number, { traditional: string; modern: string; gemstone: string }> = {
  1: { traditional: "Paper", modern: "Clock", gemstone: "Gold" },
  2: { traditional: "Cotton", modern: "China", gemstone: "Garnet" },
  3: { traditional: "Leather", modern: "Crystal or glass", gemstone: "Pearl" },
  4: { traditional: "Fruit or flowers", modern: "Appliances", gemstone: "Blue topaz" },
  5: { traditional: "Wood", modern: "Silverware", gemstone: "Sapphire" },
  6: { traditional: "Iron", modern: "Wood object", gemstone: "Amethyst" },
  7: { traditional: "Wool or copper", modern: "Desk set", gemstone: "Onyx" },
  8: { traditional: "Bronze", modern: "Linens or lace", gemstone: "Tourmaline" },
  9: { traditional: "Pottery", modern: "Leather", gemstone: "Lapis lazuli" },
  10: { traditional: "Tin or aluminum", modern: "Diamond jewelry", gemstone: "Diamond" },
  11: { traditional: "Steel", modern: "Fashion jewelry", gemstone: "Turquoise" },
  12: { traditional: "Silk or linen", modern: "Pearls", gemstone: "Jade" },
  13: { traditional: "Lace", modern: "Textiles", gemstone: "Citrine" },
  14: { traditional: "Ivory", modern: "Gold jewelry", gemstone: "Opal" },
  15: { traditional: "Crystal", modern: "Watches", gemstone: "Ruby" },
};

const baseOccasionConfigByType: Record<PlannableOccasionType, BaseOccasionConfig> = {
  BIRTHDAY: {
    type: "BIRTHDAY",
    slug: "birthday",
    label: "Birthday",
    shortLabel: "Birthday",
    eyebrow: "Yearly plan",
    description: "Build the birthday plan before the date sneaks up on you.",
    defaultPlannerHeadline: "Birthday gifts worth looking forward to",
    defaultSections: [{ key: "main", label: "Birthday Gifts", description: "The main birthday lineup for this year." }],
    addDraftLabel: "Quick-add birthday idea",
  },
  ANNIVERSARY: {
    type: "ANNIVERSARY",
    slug: "anniversary",
    label: "Anniversary",
    shortLabel: "Anniversary",
    eyebrow: "Milestone plan",
    description: "Keep the anniversary thoughtful, not last-minute.",
    defaultPlannerHeadline: "Anniversary planning with room for tradition",
    defaultSections: [{ key: "open", label: "Open Ideas", description: "Ideas that do not fit a specific anniversary rule lane yet." }],
    addDraftLabel: "Quick-add anniversary idea",
  },
  CHRISTMAS: {
    type: "CHRISTMAS",
    slug: "christmas",
    label: "Christmas",
    shortLabel: "Christmas",
    eyebrow: "Holiday plan",
    description: "Split stocking stuffers from the main presents so the whole plan reads clearly.",
    defaultPlannerHeadline: "Christmas planning with room for both little and big moments",
    defaultSections: [
      { key: "stocking", label: "Stocking Stuffers", description: "Smaller gifts that still feel intentional." },
      { key: "main", label: "Main Gifts", description: "The bigger centerpiece gifts for Christmas morning." },
    ],
    addDraftLabel: "Quick-add Christmas idea",
  },
  VALENTINES: {
    type: "VALENTINES",
    slug: "valentines",
    label: "Valentine's Day",
    shortLabel: "Valentine's",
    eyebrow: "Occasion plan",
    description: "Keep a simple romantic plan in one place.",
    defaultPlannerHeadline: "Valentine's ideas that feel more considered than rushed",
    defaultSections: [{ key: "main", label: "Valentine's Gifts", description: "Main ideas for this Valentine's Day." }],
    addDraftLabel: "Quick-add Valentine's idea",
  },
};

export const occasionConfigBySlug = Object.fromEntries(
  Object.values(baseOccasionConfigByType).map((config) => [config.slug, config]),
) as Record<string, BaseOccasionConfig>;

export function getOccasionConfigByType(type: PlannableOccasionType) {
  const base = baseOccasionConfigByType[type];
  return {
    ...base,
    plannerHeadline: base.defaultPlannerHeadline,
    sections: base.defaultSections,
  } satisfies OccasionConfig;
}

export function getOccasionConfigBySlug(slug: string) {
  return occasionConfigBySlug[slug] ?? null;
}

export function isPlannableOccasionType(value: string): value is PlannableOccasionType {
  return plannableOccasionTypes.includes(value as PlannableOccasionType);
}

export function getAnniversaryGuide(settingsRow: SettingsRow, year: number): AnniversaryGuide {
  const startYear = settingsRow?.anniversaryStartYear;
  const anniversaryNumber = startYear ? year - startYear : null;

  if (!anniversaryNumber || anniversaryNumber < 1) {
    return {
      anniversaryNumber: null,
      traditional: "Add your anniversary start year in Settings to unlock year-specific guidance.",
      modern: "Once the start year is saved, this card can steer your tradition-based planning.",
      gemstone: "You can still use the planner today, then layer the milestone rules in afterward.",
    };
  }

  const guide = anniversaryGuideByYear[anniversaryNumber];
  if (!guide) {
    return {
      anniversaryNumber,
      traditional: "Custom",
      modern: "Custom",
      gemstone: "Custom",
    };
  }

  return {
    anniversaryNumber,
    ...guide,
  };
}

export function resolveOccasionConfig(type: PlannableOccasionType, year: number, settingsRow: SettingsRow) {
  const base = getOccasionConfigByType(type);

  if (type !== "ANNIVERSARY") {
    return {
      config: base,
      guide: null,
    };
  }

  const guide = getAnniversaryGuide(settingsRow, year);

  return {
    config: {
      ...base,
      plannerHeadline: guide.anniversaryNumber
        ? `Plan around year ${guide.anniversaryNumber}: ${guide.traditional}, ${guide.modern}, and ${guide.gemstone}`
        : base.plannerHeadline,
      sections: [
        {
          key: "traditional",
          label: guide.anniversaryNumber ? `Traditional: ${guide.traditional}` : "Traditional Track",
          description: "Classic anniversary materials and motifs for this milestone year.",
        },
        {
          key: "modern",
          label: guide.anniversaryNumber ? `Modern: ${guide.modern}` : "Modern Track",
          description: "Contemporary anniversary ideas that still match the current year.",
        },
        {
          key: "gemstone",
          label: guide.anniversaryNumber ? `Gemstone: ${guide.gemstone}` : "Gemstone Track",
          description: "Jewelry, color, or symbolic ideas connected to this year's gemstone.",
        },
        {
          key: "open",
          label: "Open Ideas",
          description: "Ideas you like but have not mapped to a specific anniversary tradition yet.",
        },
      ],
    },
    guide,
  };
}
