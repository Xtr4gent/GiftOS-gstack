CREATE TABLE "occasion_gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occasion_year_id" uuid NOT NULL,
	"gift_id" uuid,
	"section_key" varchar(64) DEFAULT 'main' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"draft_name" varchar(255),
	"draft_notes" text,
	"draft_product_url" text,
	"draft_target_amount" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occasion_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"occasion_type" "occasion_type" NOT NULL,
	"year" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "occasion_gifts" ADD CONSTRAINT "occasion_gifts_occasion_year_id_occasion_years_id_fk" FOREIGN KEY ("occasion_year_id") REFERENCES "public"."occasion_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occasion_gifts" ADD CONSTRAINT "occasion_gifts_gift_id_gifts_id_fk" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occasion_years" ADD CONSTRAINT "occasion_years_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "occasion_years_user_type_year_idx" ON "occasion_years" USING btree ("user_id","occasion_type","year");