CREATE TYPE "public"."bureau" AS ENUM('equifax', 'experian', 'transunion');
--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM(
	'identified',
	'drafted',
	'sent',
	'responded',
	'verified',
	'removed',
	'escalated',
	'closed'
);
--> statement-breakpoint
CREATE TYPE "public"."dispute_letter_type" AS ENUM('initial', 'follow_up', 'escalation');
--> statement-breakpoint
CREATE TYPE "public"."client_document_type" AS ENUM(
	'credit_report',
	'tradeline_screenshot',
	'identity_document',
	'proof_of_address',
	'statement',
	'letter',
	'other'
);
--> statement-breakpoint
CREATE TABLE "credit_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"bureau" "bureau" NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"report_date" timestamp with time zone NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tradelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"credit_report_id" uuid NOT NULL,
	"bureau" "bureau" NOT NULL,
	"creditor_name" text NOT NULL,
	"account_number" text DEFAULT '' NOT NULL,
	"account_type" text DEFAULT '' NOT NULL,
	"account_status" text DEFAULT '' NOT NULL,
	"balance" text DEFAULT '0' NOT NULL,
	"high_credit" text DEFAULT '0' NOT NULL,
	"monthly_payment" text DEFAULT '0' NOT NULL,
	"reported_date" timestamp with time zone,
	"opened_date" timestamp with time zone,
	"closed_date" timestamp with time zone,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"credit_report_id" uuid,
	"tradeline_id" uuid,
	"bureau" "bureau" NOT NULL,
	"status" "dispute_status" DEFAULT 'identified' NOT NULL,
	"round_number" integer DEFAULT 1 NOT NULL,
	"reason" text NOT NULL,
	"evidence_summary" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"due_date" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispute_letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"dispute_item_id" uuid NOT NULL,
	"round_number" integer DEFAULT 1 NOT NULL,
	"type" "dispute_letter_type" DEFAULT 'initial' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"recipient_name" text DEFAULT '' NOT NULL,
	"letter_text" text NOT NULL,
	"metadata" text DEFAULT '' NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"dispute_item_id" uuid,
	"credit_report_id" uuid,
	"document_type" "client_document_type" DEFAULT 'other' NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_reports" ADD CONSTRAINT "credit_reports_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_reports" ADD CONSTRAINT "credit_reports_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradelines" ADD CONSTRAINT "tradelines_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradelines" ADD CONSTRAINT "tradelines_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradelines" ADD CONSTRAINT "tradelines_credit_report_id_credit_reports_id_fk" FOREIGN KEY ("credit_report_id") REFERENCES "public"."credit_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_items" ADD CONSTRAINT "dispute_items_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_items" ADD CONSTRAINT "dispute_items_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_items" ADD CONSTRAINT "dispute_items_credit_report_id_credit_reports_id_fk" FOREIGN KEY ("credit_report_id") REFERENCES "public"."credit_reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_items" ADD CONSTRAINT "dispute_items_tradeline_id_tradelines_id_fk" FOREIGN KEY ("tradeline_id") REFERENCES "public"."tradelines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_letters" ADD CONSTRAINT "dispute_letters_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_letters" ADD CONSTRAINT "dispute_letters_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_letters" ADD CONSTRAINT "dispute_letters_dispute_item_id_dispute_items_id_fk" FOREIGN KEY ("dispute_item_id") REFERENCES "public"."dispute_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_dispute_item_id_dispute_items_id_fk" FOREIGN KEY ("dispute_item_id") REFERENCES "public"."dispute_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_credit_report_id_credit_reports_id_fk" FOREIGN KEY ("credit_report_id") REFERENCES "public"."credit_reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_credit_reports_agency_id" ON "credit_reports" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_credit_reports_client_id" ON "credit_reports" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_credit_reports_bureau" ON "credit_reports" USING btree ("bureau");--> statement-breakpoint
CREATE INDEX "idx_credit_reports_report_date" ON "credit_reports" USING btree ("report_date");--> statement-breakpoint
CREATE INDEX "idx_tradelines_agency_id" ON "tradelines" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_tradelines_client_id" ON "tradelines" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_tradelines_credit_report_id" ON "tradelines" USING btree ("credit_report_id");--> statement-breakpoint
CREATE INDEX "idx_tradelines_bureau" ON "tradelines" USING btree ("bureau");--> statement-breakpoint
CREATE INDEX "idx_tradelines_account_status" ON "tradelines" USING btree ("account_status");--> statement-breakpoint
CREATE INDEX "idx_dispute_items_agency_id" ON "dispute_items" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_items_client_id" ON "dispute_items" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_items_credit_report_id" ON "dispute_items" USING btree ("credit_report_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_items_tradeline_id" ON "dispute_items" USING btree ("tradeline_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_items_status" ON "dispute_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_dispute_items_bureau" ON "dispute_items" USING btree ("bureau");--> statement-breakpoint
CREATE INDEX "idx_dispute_items_due_date" ON "dispute_items" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "idx_dispute_letters_agency_id" ON "dispute_letters" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_letters_client_id" ON "dispute_letters" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_letters_dispute_item_id" ON "dispute_letters" USING btree ("dispute_item_id");--> statement-breakpoint
CREATE INDEX "idx_dispute_letters_round_number" ON "dispute_letters" USING btree ("round_number");--> statement-breakpoint
CREATE INDEX "idx_dispute_letters_status" ON "dispute_letters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_client_documents_agency_id" ON "client_documents" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "idx_client_documents_client_id" ON "client_documents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_client_documents_dispute_item_id" ON "client_documents" USING btree ("dispute_item_id");--> statement-breakpoint
CREATE INDEX "idx_client_documents_document_type" ON "client_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_client_documents_uploaded_at" ON "client_documents" USING btree ("uploaded_at");
