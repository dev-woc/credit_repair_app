import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const bureauEnum = pgEnum("bureau", ["equifax", "experian", "transunion"]);
export const disputeStatusEnum = pgEnum("dispute_status", [
	"identified",
	"drafted",
	"sent",
	"responded",
	"verified",
	"removed",
	"escalated",
	"closed",
]);
export const disputeLetterTypeEnum = pgEnum("dispute_letter_type", [
	"initial",
	"follow_up",
	"escalation",
]);
export const clientDocumentTypeEnum = pgEnum("client_document_type", [
	"credit_report",
	"tradeline_screenshot",
	"identity_document",
	"proof_of_address",
	"statement",
	"letter",
	"other",
]);

export const agencies = pgTable(
	"agencies",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		ownerId: text("owner_id").notNull().unique(),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		plan: text("plan").notNull().default("starter"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		uniqueIndex("idx_agencies_slug").on(table.slug),
		uniqueIndex("idx_agencies_owner_id").on(table.ownerId),
	],
);

export const teamMembers = pgTable(
	"team_members",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		agencyId: uuid("agency_id")
			.notNull()
			.references(() => agencies.id, { onDelete: "cascade" }),
		userId: text("user_id").notNull(),
		role: text("role").notNull().default("analyst"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_team_members_agency_id").on(table.agencyId),
		index("idx_team_members_user_id").on(table.userId),
		uniqueIndex("idx_team_members_agency_user").on(table.agencyId, table.userId),
	],
);

export const clients = pgTable(
	"clients",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		agencyId: uuid("agency_id")
			.notNull()
			.references(() => agencies.id, { onDelete: "cascade" }),
		firstName: text("first_name").notNull(),
		lastName: text("last_name").notNull(),
		email: text("email").notNull(),
		phone: text("phone").notNull().default(""),
		goals: text("goals").notNull().default("general"),
		status: text("status").notNull().default("active"),
		notes: text("notes").notNull().default(""),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_clients_agency_id").on(table.agencyId),
		index("idx_clients_status").on(table.status),
		index("idx_clients_created_at").on(table.createdAt),
	],
);

export const clientContracts = pgTable(
	"client_contracts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		clientId: uuid("client_id")
			.notNull()
			.references(() => clients.id, { onDelete: "cascade" })
			.unique(),
		agencyId: uuid("agency_id")
			.notNull()
			.references(() => agencies.id, { onDelete: "cascade" }),
		status: text("status").notNull().default("pending_signature"),
		contractText: text("contract_text").notNull(),
		signedAt: timestamp("signed_at", { withTimezone: true }),
		cancellationDeadline: timestamp("cancellation_deadline", { withTimezone: true }),
		cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_contracts_agency_id").on(table.agencyId),
		index("idx_contracts_client_id").on(table.clientId),
		index("idx_contracts_status").on(table.status),
	],
);

export const creditReports = pgTable(
	"credit_reports",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		agencyId: uuid("agency_id")
			.notNull()
			.references(() => agencies.id, { onDelete: "cascade" }),
		clientId: uuid("client_id")
			.notNull()
			.references(() => clients.id, { onDelete: "cascade" }),
		bureau: bureauEnum("bureau").notNull(),
		source: text("source").notNull().default("manual"),
		reportDate: timestamp("report_date", { withTimezone: true }).notNull(),
		importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
		notes: text("notes").notNull().default(""),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_credit_reports_agency_id").on(table.agencyId),
		index("idx_credit_reports_client_id").on(table.clientId),
		index("idx_credit_reports_bureau").on(table.bureau),
		index("idx_credit_reports_report_date").on(table.reportDate),
	],
);

export const tradelines = pgTable(
	"tradelines",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		agencyId: uuid("agency_id")
			.notNull()
			.references(() => agencies.id, { onDelete: "cascade" }),
		clientId: uuid("client_id")
			.notNull()
			.references(() => clients.id, { onDelete: "cascade" }),
		creditReportId: uuid("credit_report_id")
			.notNull()
			.references(() => creditReports.id, { onDelete: "cascade" }),
		bureau: bureauEnum("bureau").notNull(),
		creditorName: text("creditor_name").notNull(),
		accountNumber: text("account_number").notNull().default(""),
		accountType: text("account_type").notNull().default(""),
		accountStatus: text("account_status").notNull().default(""),
		balance: text("balance").notNull().default("0"),
		highCredit: text("high_credit").notNull().default("0"),
		monthlyPayment: text("monthly_payment").notNull().default("0"),
		reportedDate: timestamp("reported_date", { withTimezone: true }),
		openedDate: timestamp("opened_date", { withTimezone: true }),
		closedDate: timestamp("closed_date", { withTimezone: true }),
		notes: text("notes").notNull().default(""),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_tradelines_agency_id").on(table.agencyId),
		index("idx_tradelines_client_id").on(table.clientId),
		index("idx_tradelines_credit_report_id").on(table.creditReportId),
		index("idx_tradelines_bureau").on(table.bureau),
		index("idx_tradelines_account_status").on(table.accountStatus),
	],
);

export const disputeItems = pgTable(
	"dispute_items",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		agencyId: uuid("agency_id")
			.notNull()
			.references(() => agencies.id, { onDelete: "cascade" }),
		clientId: uuid("client_id")
			.notNull()
			.references(() => clients.id, { onDelete: "cascade" }),
		creditReportId: uuid("credit_report_id").references(() => creditReports.id, {
			onDelete: "set null",
		}),
		tradelineId: uuid("tradeline_id").references(() => tradelines.id, {
			onDelete: "set null",
		}),
		bureau: bureauEnum("bureau").notNull(),
		status: disputeStatusEnum("status").notNull().default("identified"),
		roundNumber: integer("round_number").notNull().default(1),
		reason: text("reason").notNull(),
		evidenceSummary: text("evidence_summary").notNull().default(""),
		notes: text("notes").notNull().default(""),
		dueDate: timestamp("due_date", { withTimezone: true }),
		sentAt: timestamp("sent_at", { withTimezone: true }),
		respondedAt: timestamp("responded_at", { withTimezone: true }),
		resolvedAt: timestamp("resolved_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_dispute_items_agency_id").on(table.agencyId),
		index("idx_dispute_items_client_id").on(table.clientId),
		index("idx_dispute_items_credit_report_id").on(table.creditReportId),
		index("idx_dispute_items_tradeline_id").on(table.tradelineId),
		index("idx_dispute_items_status").on(table.status),
		index("idx_dispute_items_bureau").on(table.bureau),
		index("idx_dispute_items_due_date").on(table.dueDate),
	],
);

export const disputeLetters = pgTable(
	"dispute_letters",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		agencyId: uuid("agency_id")
			.notNull()
			.references(() => agencies.id, { onDelete: "cascade" }),
		clientId: uuid("client_id")
			.notNull()
			.references(() => clients.id, { onDelete: "cascade" }),
		disputeItemId: uuid("dispute_item_id")
			.notNull()
			.references(() => disputeItems.id, { onDelete: "cascade" }),
		roundNumber: integer("round_number").notNull().default(1),
		type: disputeLetterTypeEnum("type").notNull().default("initial"),
		status: text("status").notNull().default("draft"),
		recipientName: text("recipient_name").notNull().default(""),
		letterText: text("letter_text").notNull(),
		metadata: text("metadata").notNull().default(""),
		generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
		sentAt: timestamp("sent_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_dispute_letters_agency_id").on(table.agencyId),
		index("idx_dispute_letters_client_id").on(table.clientId),
		index("idx_dispute_letters_dispute_item_id").on(table.disputeItemId),
		index("idx_dispute_letters_round_number").on(table.roundNumber),
		index("idx_dispute_letters_status").on(table.status),
	],
);

export const clientDocuments = pgTable(
	"client_documents",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		agencyId: uuid("agency_id")
			.notNull()
			.references(() => agencies.id, { onDelete: "cascade" }),
		clientId: uuid("client_id")
			.notNull()
			.references(() => clients.id, { onDelete: "cascade" }),
		disputeItemId: uuid("dispute_item_id").references(() => disputeItems.id, {
			onDelete: "set null",
		}),
		creditReportId: uuid("credit_report_id").references(() => creditReports.id, {
			onDelete: "set null",
		}),
		documentType: clientDocumentTypeEnum("document_type").notNull().default("other"),
		fileName: text("file_name").notNull(),
		fileUrl: text("file_url").notNull(),
		mimeType: text("mime_type").notNull().default(""),
		notes: text("notes").notNull().default(""),
		uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_client_documents_agency_id").on(table.agencyId),
		index("idx_client_documents_client_id").on(table.clientId),
		index("idx_client_documents_dispute_item_id").on(table.disputeItemId),
		index("idx_client_documents_document_type").on(table.documentType),
		index("idx_client_documents_uploaded_at").on(table.uploadedAt),
	],
);

export const agenciesRelations = relations(agencies, ({ many }) => ({
	teamMembers: many(teamMembers),
	clients: many(clients),
	contracts: many(clientContracts),
	creditReports: many(creditReports),
	tradelines: many(tradelines),
	disputeItems: many(disputeItems),
	disputeLetters: many(disputeLetters),
	clientDocuments: many(clientDocuments),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
	agency: one(agencies, { fields: [teamMembers.agencyId], references: [agencies.id] }),
}));

export const clientsRelations = relations(clients, ({ one }) => ({
	agency: one(agencies, { fields: [clients.agencyId], references: [agencies.id] }),
	contract: one(clientContracts, { fields: [clients.id], references: [clientContracts.clientId] }),
}));

export const clientContractsRelations = relations(clientContracts, ({ one }) => ({
	client: one(clients, { fields: [clientContracts.clientId], references: [clients.id] }),
	agency: one(agencies, { fields: [clientContracts.agencyId], references: [agencies.id] }),
}));

export const creditReportsRelations = relations(creditReports, ({ one, many }) => ({
	agency: one(agencies, { fields: [creditReports.agencyId], references: [agencies.id] }),
	client: one(clients, { fields: [creditReports.clientId], references: [clients.id] }),
	tradelines: many(tradelines),
	disputeItems: many(disputeItems),
	clientDocuments: many(clientDocuments),
}));

export const tradelinesRelations = relations(tradelines, ({ one, many }) => ({
	agency: one(agencies, { fields: [tradelines.agencyId], references: [agencies.id] }),
	client: one(clients, { fields: [tradelines.clientId], references: [clients.id] }),
	creditReport: one(creditReports, {
		fields: [tradelines.creditReportId],
		references: [creditReports.id],
	}),
	disputeItems: many(disputeItems),
}));

export const disputeItemsRelations = relations(disputeItems, ({ one, many }) => ({
	agency: one(agencies, { fields: [disputeItems.agencyId], references: [agencies.id] }),
	client: one(clients, { fields: [disputeItems.clientId], references: [clients.id] }),
	creditReport: one(creditReports, {
		fields: [disputeItems.creditReportId],
		references: [creditReports.id],
	}),
	tradeline: one(tradelines, {
		fields: [disputeItems.tradelineId],
		references: [tradelines.id],
	}),
	letters: many(disputeLetters),
	documents: many(clientDocuments),
}));

export const disputeLettersRelations = relations(disputeLetters, ({ one }) => ({
	agency: one(agencies, { fields: [disputeLetters.agencyId], references: [agencies.id] }),
	client: one(clients, { fields: [disputeLetters.clientId], references: [clients.id] }),
	disputeItem: one(disputeItems, {
		fields: [disputeLetters.disputeItemId],
		references: [disputeItems.id],
	}),
}));

export const clientDocumentsRelations = relations(clientDocuments, ({ one }) => ({
	agency: one(agencies, { fields: [clientDocuments.agencyId], references: [agencies.id] }),
	client: one(clients, { fields: [clientDocuments.clientId], references: [clients.id] }),
	disputeItem: one(disputeItems, {
		fields: [clientDocuments.disputeItemId],
		references: [disputeItems.id],
	}),
	creditReport: one(creditReports, {
		fields: [clientDocuments.creditReportId],
		references: [creditReports.id],
	}),
}));
