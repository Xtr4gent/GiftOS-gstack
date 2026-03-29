CREATE TYPE "public"."gift_status" AS ENUM('IDEA', 'PURCHASED', 'RECEIVED', 'GIVEN');--> statement-breakpoint
CREATE TYPE "public"."occasion_type" AS ENUM('BIRTHDAY', 'ANNIVERSARY', 'CHRISTMAS', 'VALENTINES', 'OTHER');--> statement-breakpoint
CREATE TABLE "gift_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gift_id" uuid NOT NULL,
	"bucket_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"byte_size" integer NOT NULL,
	"alt_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_tags" (
	"gift_id" uuid NOT NULL,
	"tag" varchar(64) NOT NULL,
	CONSTRAINT "gift_tags_gift_id_tag_pk" PRIMARY KEY("gift_id","tag")
);
--> statement-breakpoint
CREATE TABLE "gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"notes" text,
	"product_url" text,
	"store_name" varchar(255),
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"base_price_amount" integer DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"shipping_amount" integer DEFAULT 0 NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"status" "gift_status" DEFAULT 'IDEA' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_one_off" boolean DEFAULT false NOT NULL,
	"is_wrapped" boolean DEFAULT false NOT NULL,
	"occasion_type" "occasion_type",
	"occasion_year" integer,
	"purchased_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"wrapped_at" timestamp with time zone,
	"given_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"ring_size" varchar(32),
	"bracelet_size" varchar(32),
	"necklace_length" varchar(32),
	"shoe_size" varchar(32),
	"clothing_size" varchar(32),
	"favorite_colors" text[] DEFAULT '{}' NOT NULL,
	"favorite_brands" text[] DEFAULT '{}' NOT NULL,
	"do_not_buy_items" text[] DEFAULT '{}' NOT NULL,
	"wish_categories" text[] DEFAULT '{}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"birthday_month" integer,
	"birthday_day" integer,
	"anniversary_month" integer,
	"anniversary_day" integer,
	"anniversary_start_year" integer,
	"timezone" varchar(100) DEFAULT 'America/Toronto' NOT NULL,
	"default_currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "gift_images" ADD CONSTRAINT "gift_images_gift_id_gifts_id_fk" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_tags" ADD CONSTRAINT "gift_tags_gift_id_gifts_id_fk" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;