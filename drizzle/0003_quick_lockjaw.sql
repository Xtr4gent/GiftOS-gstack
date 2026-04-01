CREATE TABLE "theme_month_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_year_id" uuid NOT NULL,
	"month_number" integer NOT NULL,
	"gift_id" uuid,
	"position" integer DEFAULT 0 NOT NULL,
	"draft_name" varchar(255),
	"draft_notes" text,
	"draft_product_url" text,
	"draft_target_amount" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theme_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"name" varchar(255) DEFAULT 'Theme of the Year' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "theme_month_items" ADD CONSTRAINT "theme_month_items_theme_year_id_theme_years_id_fk" FOREIGN KEY ("theme_year_id") REFERENCES "public"."theme_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_month_items" ADD CONSTRAINT "theme_month_items_gift_id_gifts_id_fk" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_years" ADD CONSTRAINT "theme_years_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "theme_years_user_year_idx" ON "theme_years" USING btree ("user_id","year");