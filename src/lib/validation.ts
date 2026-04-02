import { z } from "zod";

const tagSchema = z.array(z.string().trim().min(1).max(64)).max(20);

export const giftInputSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    notes: z.string().trim().max(5000).optional().nullable(),
    productUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),
    storeName: z.string().trim().max(255).optional().nullable(),
    currencyCode: z.string().trim().length(3).default("USD"),
    basePriceAmount: z.number().int().min(0),
    taxAmount: z.number().int().min(0),
    shippingAmount: z.number().int().min(0),
    totalAmount: z.number().int().min(0),
    status: z.enum(["IDEA", "PURCHASED", "RECEIVED", "GIVEN"]),
    isPinned: z.boolean().default(false),
    isArchived: z.boolean().default(false),
    isOneOff: z.boolean().default(false),
    isWrapped: z.boolean().default(false),
    occasionType: z.enum(["BIRTHDAY", "ANNIVERSARY", "CHRISTMAS", "VALENTINES", "OTHER"]).optional().nullable(),
    occasionYear: z.number().int().min(2000).max(2100).optional().nullable(),
    purchasedAt: z.string().datetime({ offset: true }).optional().nullable(),
    receivedAt: z.string().datetime({ offset: true }).optional().nullable(),
    wrappedAt: z.string().datetime({ offset: true }).optional().nullable(),
    givenAt: z.string().datetime({ offset: true }).optional().nullable(),
    tags: tagSchema.default([]),
  })
  .superRefine((value, ctx) => {
    if (value.status === "GIVEN" && !value.givenAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Given gifts must include the date they were given.",
        path: ["givenAt"],
      });
    }
  });

export const settingsInputSchema = z.object({
  birthdayMonth: z.number().int().min(1).max(12).optional().nullable(),
  birthdayDay: z.number().int().min(1).max(31).optional().nullable(),
  anniversaryMonth: z.number().int().min(1).max(12).optional().nullable(),
  anniversaryDay: z.number().int().min(1).max(31).optional().nullable(),
  anniversaryStartYear: z.number().int().min(1900).max(2100).optional().nullable(),
  timezone: z.string().trim().min(1).max(100),
  defaultCurrencyCode: z.string().trim().length(3),
  ringSize: z.string().trim().max(32).optional().nullable(),
  braceletSize: z.string().trim().max(32).optional().nullable(),
  necklaceLength: z.string().trim().max(32).optional().nullable(),
  shoeSize: z.string().trim().max(32).optional().nullable(),
  clothingSize: z.string().trim().max(32).optional().nullable(),
  favoriteColors: z.array(z.string().trim().min(1)).default([]),
  favoriteBrands: z.array(z.string().trim().min(1)).default([]),
  doNotBuyItems: z.array(z.string().trim().min(1)).default([]),
  wishCategories: z.array(z.string().trim().min(1)).default([]),
});

export const occasionItemCreateSchema = z
  .object({
    sectionKey: z.string().trim().min(1).max(64),
    giftId: z.string().uuid().optional().nullable(),
    draftName: z.string().trim().min(1).max(255).optional().nullable(),
    draftNotes: z.string().trim().max(5000).optional().nullable(),
    draftProductUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),
    draftTargetAmount: z.number().int().min(0).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const hasGiftId = Boolean(value.giftId);
    const hasDraftName = Boolean(value.draftName);

    if (hasGiftId === hasDraftName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add either an existing gift or a draft idea.",
        path: ["giftId"],
      });
    }
  });

export const occasionItemUpdateSchema = z
  .object({
    sectionKey: z.string().trim().min(1).max(64),
    giftId: z.string().uuid().optional().nullable(),
    draftName: z.string().trim().min(1).max(255).optional().nullable(),
    draftNotes: z.string().trim().max(5000).optional().nullable(),
    draftProductUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),
    draftTargetAmount: z.number().int().min(0).optional().nullable(),
  })
  .strict();

export const occasionYearUpdateSchema = z.object({
  themeName: z.string().trim().min(1).max(255).optional().nullable(),
});

export const themeYearUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
});

export const themeItemCreateSchema = z
  .object({
    monthNumber: z.number().int().min(1).max(12),
    giftId: z.string().uuid().optional().nullable(),
    draftName: z.string().trim().min(1).max(255).optional().nullable(),
    draftNotes: z.string().trim().max(5000).optional().nullable(),
    draftProductUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),
    draftTargetAmount: z.number().int().min(0).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const hasGiftId = Boolean(value.giftId);
    const hasDraftName = Boolean(value.draftName);

    if (hasGiftId === hasDraftName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add either an existing gift or a draft idea.",
        path: ["giftId"],
      });
    }
  });

export const themeItemUpdateSchema = z
  .object({
    monthNumber: z.number().int().min(1).max(12),
    giftId: z.string().uuid().optional().nullable(),
    draftName: z.string().trim().min(1).max(255).optional().nullable(),
    draftNotes: z.string().trim().max(5000).optional().nullable(),
    draftProductUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),
    draftTargetAmount: z.number().int().min(0).optional().nullable(),
  })
  .strict();

export const themeItemAssignSchema = z.object({
  occasionType: z.enum(["BIRTHDAY", "ANNIVERSARY", "CHRISTMAS", "VALENTINES"]),
  year: z.number().int().min(2000).max(2100),
});
