CREATE TABLE "call_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"call_id" text NOT NULL,
	"note_type" text DEFAULT 'Text' NOT NULL,
	"note_text" text NOT NULL,
	"author_discord_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_units" (
	"call_id" text NOT NULL,
	"discord_id" text NOT NULL,
	"assigned_at" text NOT NULL,
	CONSTRAINT "call_units_call_id_discord_id_pk" PRIMARY KEY("call_id","discord_id")
);
--> statement-breakpoint
CREATE TABLE "calls" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"team" text,
	"department" text,
	"status" text DEFAULT 'new' NOT NULL,
	"type" text,
	"origin" text,
	"primary_unit_callsign" text,
	"panels" text DEFAULT 'All' NOT NULL,
	"code" text,
	"priority" text,
	"postal" text,
	"address" text,
	"source" text NOT NULL,
	"civilian_discord_id" text,
	"created_by" text,
	"created_at" text NOT NULL,
	"cleared_at" text
);
--> statement-breakpoint
CREATE TABLE "callsigns" (
	"department" text NOT NULL,
	"number" integer NOT NULL,
	"rank" text NOT NULL,
	"discord_id" text NOT NULL,
	"assigned_at" text NOT NULL,
	"assigned_by" text DEFAULT '' NOT NULL,
	"total_seconds" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "callsigns_department_number_pk" PRIMARY KEY("department","number")
);
--> statement-breakpoint
CREATE TABLE "citations" (
	"id" serial PRIMARY KEY NOT NULL,
	"civilian_discord_id" text NOT NULL,
	"officer_discord_id" text NOT NULL,
	"offense" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "civilian_profiles" (
	"discord_id" text PRIMARY KEY NOT NULL,
	"alias" text NOT NULL,
	"birthday" text NOT NULL,
	"gender" text,
	"rp_name" text NOT NULL,
	"balance" numeric(10, 2) DEFAULT '500.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"discord_id" text PRIMARY KEY NOT NULL,
	"roblox_username" text NOT NULL,
	"roblox_user_id" text,
	"verified_at" text NOT NULL,
	CONSTRAINT "links_roblox_username_unique" UNIQUE("roblox_username")
);
--> statement-breakpoint
CREATE TABLE "live_units" (
	"callsign_key" text PRIMARY KEY NOT NULL,
	"department" text NOT NULL,
	"number" integer NOT NULL,
	"discord_id" text,
	"roblox_username" text,
	"rank" text,
	"on_duty" boolean DEFAULT false NOT NULL,
	"call_id" text,
	"postal" text,
	"location" text,
	"agency" text,
	"subdivision" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "squad_units" (
	"squad_id" integer NOT NULL,
	"callsign_key" text NOT NULL,
	CONSTRAINT "squad_units_squad_id_callsign_key_pk" PRIMARY KEY("squad_id","callsign_key")
);
--> statement-breakpoint
CREATE TABLE "squads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"department" text NOT NULL,
	"status" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
