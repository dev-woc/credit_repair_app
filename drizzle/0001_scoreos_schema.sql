DROP TABLE IF EXISTS "click_events";--> statement-breakpoint
DROP TABLE IF EXISTS "link_items";--> statement-breakpoint
DROP TABLE IF EXISTS "profiles";--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" text DEFAULT 'starter' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agencies_owner_id_unique" UNIQUE("owner_id"),
	CONSTRAINT "agencies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'analyst' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"goals" text DEFAULT 'general' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"agency_id" uuid NOT NULL,
	"status" text DEFAULT 'pending_signature' NOT NULL,
	"contract_text" text NOT NULL,
	"signed_at" timestamp with time zone,
	"cancellation_deadline" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_contracts_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_agencies_slug" ON "agencies" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_agencies_owner_id" ON "agencies" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_agency_id" ON "team_members" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_team_members_user_id" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_team_members_agency_user" ON "team_members" USING btree ("agency_id", "user_id");--> statement-breakpoint
CREATE INDEX "idx_clients_agency_id" ON "clients" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_clients_status" ON "clients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_clients_created_at" ON "clients" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_contracts_agency_id" ON "client_contracts" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_contracts_client_id" ON "client_contracts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_contracts_status" ON "client_contracts" USING btree ("status");
