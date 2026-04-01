import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const giftStatusEnum = pgEnum("gift_status", ["IDEA", "PURCHASED", "RECEIVED", "GIVEN"]);
export const occasionTypeEnum = pgEnum("occasion_type", [
  "BIRTHDAY",
  "ANNIVERSARY",
  "CHRISTMAS",
  "VALENTINES",
  "OTHER",
]);

/*
Entity map
==========
users
  ├── gifts
  │     └── gift_images
  ├── settings
  └── preferences
*/

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const gifts = pgTable("gifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  notes: text("notes"),
  productUrl: text("product_url"),
  storeName: varchar("store_name", { length: 255 }),
  currencyCode: varchar("currency_code", { length: 3 }).default("USD").notNull(),
  basePriceAmount: integer("base_price_amount").default(0).notNull(),
  taxAmount: integer("tax_amount").default(0).notNull(),
  shippingAmount: integer("shipping_amount").default(0).notNull(),
  totalAmount: integer("total_amount").default(0).notNull(),
  status: giftStatusEnum("status").default("IDEA").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  isOneOff: boolean("is_one_off").default(false).notNull(),
  isWrapped: boolean("is_wrapped").default(false).notNull(),
  occasionType: occasionTypeEnum("occasion_type"),
  occasionYear: integer("occasion_year"),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }),
  receivedAt: timestamp("received_at", { withTimezone: true }),
  wrappedAt: timestamp("wrapped_at", { withTimezone: true }),
  givenAt: timestamp("given_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const giftImages = pgTable("gift_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  giftId: uuid("gift_id")
    .notNull()
    .references(() => gifts.id, { onDelete: "cascade" }),
  bucketKey: text("bucket_key").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  byteSize: integer("byte_size").notNull(),
  altText: text("alt_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const giftTags = pgTable(
  "gift_tags",
  {
    giftId: uuid("gift_id")
      .notNull()
      .references(() => gifts.id, { onDelete: "cascade" }),
    tag: varchar("tag", { length: 64 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.giftId, table.tag] })],
);

export const occasionYears = pgTable(
  "occasion_years",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    occasionType: occasionTypeEnum("occasion_type").notNull(),
    year: integer("year").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("occasion_years_user_type_year_idx").on(table.userId, table.occasionType, table.year)],
);

export const occasionGifts = pgTable("occasion_gifts", {
  id: uuid("id").defaultRandom().primaryKey(),
  occasionYearId: uuid("occasion_year_id")
    .notNull()
    .references(() => occasionYears.id, { onDelete: "cascade" }),
  giftId: uuid("gift_id").references(() => gifts.id, { onDelete: "set null" }),
  sectionKey: varchar("section_key", { length: 64 }).default("main").notNull(),
  position: integer("position").default(0).notNull(),
  draftName: varchar("draft_name", { length: 255 }),
  draftNotes: text("draft_notes"),
  draftProductUrl: text("draft_product_url"),
  draftTargetAmount: integer("draft_target_amount"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const themeYears = pgTable(
  "theme_years",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    name: varchar("name", { length: 255 }).default("Theme of the Year").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("theme_years_user_year_idx").on(table.userId, table.year)],
);

export const themeMonthItems = pgTable("theme_month_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  themeYearId: uuid("theme_year_id")
    .notNull()
    .references(() => themeYears.id, { onDelete: "cascade" }),
  monthNumber: integer("month_number").notNull(),
  giftId: uuid("gift_id").references(() => gifts.id, { onDelete: "set null" }),
  position: integer("position").default(0).notNull(),
  draftName: varchar("draft_name", { length: 255 }),
  draftNotes: text("draft_notes"),
  draftProductUrl: text("draft_product_url"),
  draftTargetAmount: integer("draft_target_amount"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  birthdayMonth: integer("birthday_month"),
  birthdayDay: integer("birthday_day"),
  anniversaryMonth: integer("anniversary_month"),
  anniversaryDay: integer("anniversary_day"),
  anniversaryStartYear: integer("anniversary_start_year"),
  timezone: varchar("timezone", { length: 100 }).default("America/Toronto").notNull(),
  defaultCurrencyCode: varchar("default_currency_code", { length: 3 }).default("USD").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const preferences = pgTable("preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  ringSize: varchar("ring_size", { length: 32 }),
  braceletSize: varchar("bracelet_size", { length: 32 }),
  necklaceLength: varchar("necklace_length", { length: 32 }),
  shoeSize: varchar("shoe_size", { length: 32 }),
  clothingSize: varchar("clothing_size", { length: 32 }),
  favoriteColors: text("favorite_colors").array().default([]).notNull(),
  favoriteBrands: text("favorite_brands").array().default([]).notNull(),
  doNotBuyItems: text("do_not_buy_items").array().default([]).notNull(),
  wishCategories: text("wish_categories").array().default([]).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
