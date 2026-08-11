CREATE TABLE "bolos" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_name" text,
	"description" text NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"issued_by" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"civilian_discord_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"date_of_birth" text NOT NULL,
	"sex" text,
	"address" text,
	"phone_number" text,
	"linked_roblox_username" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "licences" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"type" text DEFAULT 'Driver' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"subject_name" text,
	"status" text DEFAULT 'final' NOT NULL,
	"created_by" text NOT NULL,
	"department" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"plate" text NOT NULL,
	"make" text,
	"model" text,
	"colour" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_plate_unique" UNIQUE("plate")
);
--> statement-breakpoint
CREATE TABLE "warrants" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_name" text NOT NULL,
	"charges" text NOT NULL,
	"signature" text,
	"status" text DEFAULT 'active' NOT NULL,
	"issued_by" text NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "calls" ADD COLUMN "call_number" serial NOT NULL;