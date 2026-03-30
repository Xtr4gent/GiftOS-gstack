import { parseMoneyToMinorUnits, sumMinorUnits } from "@/lib/money";

function truthy(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function nullableText(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text ? text : null;
}

function nullableInt(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  if (!text) return null;
  return Number(text);
}

function nullableDate(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  if (!text) return null;
  return new Date(text).toISOString();
}

export function parseTagsInput(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function parseGiftFormData(formData: FormData) {
  const basePriceAmount = parseMoneyToMinorUnits(formData.get("basePriceAmount")?.toString());
  const taxAmount = parseMoneyToMinorUnits(formData.get("taxAmount")?.toString());
  const shippingAmount = parseMoneyToMinorUnits(formData.get("shippingAmount")?.toString());

  return {
    name: formData.get("name")?.toString() ?? "",
    notes: nullableText(formData.get("notes")),
    productUrl: nullableText(formData.get("productUrl")),
    storeName: nullableText(formData.get("storeName")),
    currencyCode: (formData.get("currencyCode")?.toString() || "USD").toUpperCase(),
    basePriceAmount,
    taxAmount,
    shippingAmount,
    totalAmount: sumMinorUnits(basePriceAmount, taxAmount, shippingAmount),
    status: formData.get("status")?.toString() || "IDEA",
    isPinned: truthy(formData.get("isPinned")),
    isArchived: truthy(formData.get("isArchived")),
    isOneOff: truthy(formData.get("isOneOff")),
    isWrapped: truthy(formData.get("isWrapped")),
    occasionType: nullableText(formData.get("occasionType")),
    occasionYear: nullableInt(formData.get("occasionYear")),
    purchasedAt: nullableDate(formData.get("purchasedAt")),
    receivedAt: nullableDate(formData.get("receivedAt")),
    wrappedAt: nullableDate(formData.get("wrappedAt")),
    givenAt: nullableDate(formData.get("givenAt")),
    tags: parseTagsInput(formData.get("tags")?.toString() || ""),
  };
}

export function parseSettingsFormData(formData: FormData) {
  const parseList = (key: string) =>
    (formData.get(key)?.toString() || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  return {
    birthdayMonth: nullableInt(formData.get("birthdayMonth")),
    birthdayDay: nullableInt(formData.get("birthdayDay")),
    anniversaryMonth: nullableInt(formData.get("anniversaryMonth")),
    anniversaryDay: nullableInt(formData.get("anniversaryDay")),
    anniversaryStartYear: nullableInt(formData.get("anniversaryStartYear")),
    timezone: formData.get("timezone")?.toString() || "America/Toronto",
    defaultCurrencyCode: (formData.get("defaultCurrencyCode")?.toString() || "USD").toUpperCase(),
    ringSize: nullableText(formData.get("ringSize")),
    braceletSize: nullableText(formData.get("braceletSize")),
    necklaceLength: nullableText(formData.get("necklaceLength")),
    shoeSize: nullableText(formData.get("shoeSize")),
    clothingSize: nullableText(formData.get("clothingSize")),
    favoriteColors: parseList("favoriteColors"),
    favoriteBrands: parseList("favoriteBrands"),
    doNotBuyItems: parseList("doNotBuyItems"),
    wishCategories: parseList("wishCategories"),
  };
}

export function parseOccasionItemFormData(formData: FormData) {
  return {
    sectionKey: formData.get("sectionKey")?.toString().trim() || "main",
    giftId: nullableText(formData.get("giftId")),
    draftName: nullableText(formData.get("draftName")),
    draftNotes: nullableText(formData.get("draftNotes")),
    draftProductUrl: nullableText(formData.get("draftProductUrl")),
    draftTargetAmount: (() => {
      const amount = formData.get("draftTargetAmount")?.toString();
      if (!amount?.trim()) return null;
      return parseMoneyToMinorUnits(amount);
    })(),
  };
}
