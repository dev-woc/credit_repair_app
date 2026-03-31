import type { InferSelectModel } from "drizzle-orm";
import type {
	agencies,
	clientContracts,
	clientDocuments,
	clients,
	creditReports,
	disputeItems,
	disputeLetters,
	teamMembers,
	tradelines,
} from "@/lib/db/schema";

export type Agency = InferSelectModel<typeof agencies>;
export type TeamMember = InferSelectModel<typeof teamMembers>;
export type Client = InferSelectModel<typeof clients>;
export type ClientContract = InferSelectModel<typeof clientContracts>;
export type CreditReport = InferSelectModel<typeof creditReports>;
export type Tradeline = InferSelectModel<typeof tradelines>;
export type DisputeItem = InferSelectModel<typeof disputeItems>;
export type DisputeLetter = InferSelectModel<typeof disputeLetters>;
export type ClientDocument = InferSelectModel<typeof clientDocuments>;

export type AgencyPlan = "starter" | "growth" | "scale";
export type TeamMemberRole = "owner" | "manager" | "analyst" | "viewer";
export type ClientStatus = "active" | "inactive" | "graduated";
export type ContractStatus = "pending_signature" | "signed" | "cancelled";
export type ClientGoal = "mortgage" | "auto_loan" | "credit_card" | "general";

export interface ClientWithContract extends Client {
	contract: ClientContract | null;
}

export interface ClientDisputeBundle {
	creditReports: CreditReport[];
	tradelines: Tradeline[];
	disputeItems: DisputeItem[];
	disputeLetters: DisputeLetter[];
	clientDocuments: ClientDocument[];
}

export interface AgencyWithStats extends Agency {
	totalClients: number;
	activeClients: number;
	graduatedClients: number;
}
