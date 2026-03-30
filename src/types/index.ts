import type { InferSelectModel } from "drizzle-orm";
import type { agencies, clientContracts, clients, teamMembers } from "@/lib/db/schema";

export type Agency = InferSelectModel<typeof agencies>;
export type TeamMember = InferSelectModel<typeof teamMembers>;
export type Client = InferSelectModel<typeof clients>;
export type ClientContract = InferSelectModel<typeof clientContracts>;

export type AgencyPlan = "starter" | "growth" | "scale";
export type TeamMemberRole = "owner" | "manager" | "analyst" | "viewer";
export type ClientStatus = "active" | "inactive" | "graduated";
export type ContractStatus = "pending_signature" | "signed" | "cancelled";
export type ClientGoal = "mortgage" | "auto_loan" | "credit_card" | "general";

export interface ClientWithContract extends Client {
	contract: ClientContract | null;
}

export interface AgencyWithStats extends Agency {
	totalClients: number;
	activeClients: number;
	graduatedClients: number;
}
