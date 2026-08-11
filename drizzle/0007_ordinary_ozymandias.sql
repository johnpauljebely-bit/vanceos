CREATE TABLE "unit_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"discord_id" text NOT NULL,
	"department" text NOT NULL,
	"rp_name" text NOT NULL,
	"agency" text,
	"subdivision" text,
	"items" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
