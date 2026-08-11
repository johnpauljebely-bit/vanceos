CREATE TABLE "self_dispatch_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_discord_id" text NOT NULL,
	"requester_callsign_key" text NOT NULL,
	"approver_discord_id" text NOT NULL,
	"approver_callsign_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
