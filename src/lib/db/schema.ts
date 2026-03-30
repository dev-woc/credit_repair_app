import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

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

export const agenciesRelations = relations(agencies, ({ many }) => ({
	teamMembers: many(teamMembers),
	clients: many(clients),
	contracts: many(clientContracts),
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
