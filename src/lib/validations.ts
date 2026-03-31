import { z } from "zod";

export const RESERVED_SLUGS = [
	"login",
	"signup",
	"dashboard",
	"clients",
	"settings",
	"api",
	"admin",
	"about",
	"help",
	"support",
	"terms",
	"privacy",
	"auth",
	"onboarding",
	"billing",
];

export const BUREAUS = ["equifax", "experian", "transunion"] as const;
export const DISPUTE_STATUSES = [
	"identified",
	"drafted",
	"sent",
	"responded",
	"verified",
	"removed",
	"escalated",
	"closed",
] as const;
export const DISPUTE_LETTER_TYPES = ["initial", "follow_up", "escalation"] as const;
export const CLIENT_DOCUMENT_TYPES = [
	"credit_report",
	"tradeline_screenshot",
	"identity_document",
	"proof_of_address",
	"statement",
	"letter",
	"other",
] as const;

export type Bureau = (typeof BUREAUS)[number];
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];
export type DisputeLetterType = (typeof DISPUTE_LETTER_TYPES)[number];
export type ClientDocumentType = (typeof CLIENT_DOCUMENT_TYPES)[number];

export const agencySlugSchema = z
	.string()
	.min(3, "Slug must be at least 3 characters")
	.max(40, "Slug must be at most 40 characters")
	.regex(
		/^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
		"Slug must be lowercase alphanumeric with hyphens, cannot start or end with a hyphen",
	)
	.refine((val) => !RESERVED_SLUGS.includes(val), "This slug is reserved");

export const slugSchema = agencySlugSchema;

export const agencySchema = z.object({
	name: z
		.string()
		.min(2, "Agency name must be at least 2 characters")
		.max(100, "Agency name must be at most 100 characters"),
	slug: agencySlugSchema,
});

export const clientIntakeSchema = z.object({
	firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
	lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
	email: z.string().email("Must be a valid email"),
	phone: z.string().max(20).optional().or(z.literal("")),
	goals: z
		.array(z.enum(["mortgage", "auto_loan", "credit_card", "general"]))
		.min(1, "At least one goal is required"),
	notes: z.string().max(500, "Notes must be at most 500 characters").optional().or(z.literal("")),
});

export const clientUpdateSchema = z.object({
	firstName: z.string().min(1).max(50).optional(),
	lastName: z.string().min(1).max(50).optional(),
	email: z.string().email().optional(),
	phone: z.string().max(20).optional(),
	status: z.enum(["active", "inactive", "graduated"]).optional(),
	notes: z.string().max(500).optional(),
});

export const slugCheckSchema = z.object({
	slug: z.string().min(1),
});

export const bureauSchema = z.enum(BUREAUS);
export const disputeStatusSchema = z.enum(DISPUTE_STATUSES);
export const disputeLetterTypeSchema = z.enum(DISPUTE_LETTER_TYPES);
export const clientDocumentTypeSchema = z.enum(CLIENT_DOCUMENT_TYPES);

export const creditReportCreateSchema = z.object({
	bureau: bureauSchema,
	reportDate: z.coerce.date(),
	source: z.string().min(1).max(40).optional(),
	notes: z.string().max(2000).optional().or(z.literal("")),
});

export const tradelineCreateSchema = z.object({
	creditReportId: z.string().uuid(),
	bureau: bureauSchema,
	creditorName: z.string().min(1).max(150),
	accountNumber: z.string().max(100).optional().or(z.literal("")),
	accountType: z.string().max(100).optional().or(z.literal("")),
	accountStatus: z.string().max(100).optional().or(z.literal("")),
	balance: z.string().max(32).optional(),
	highCredit: z.string().max(32).optional(),
	monthlyPayment: z.string().max(32).optional(),
	reportedDate: z.coerce.date().optional(),
	openedDate: z.coerce.date().optional(),
	closedDate: z.coerce.date().optional(),
	notes: z.string().max(2000).optional().or(z.literal("")),
});

const disputeItemBaseSchema = z.object({
	creditReportId: z.string().uuid().optional(),
	tradelineId: z.string().uuid().optional(),
	bureau: bureauSchema,
	status: disputeStatusSchema.optional(),
	roundNumber: z.coerce.number().int().min(1).max(10).optional(),
	reason: z.string().min(3).max(1000),
	evidenceSummary: z.string().max(5000).optional().or(z.literal("")),
	notes: z.string().max(5000).optional().or(z.literal("")),
	dueDate: z.coerce.date().optional(),
	sentAt: z.coerce.date().optional(),
	respondedAt: z.coerce.date().optional(),
	resolvedAt: z.coerce.date().optional(),
});

export const disputeItemCreateSchema = disputeItemBaseSchema;

export const disputeItemUpdateSchema = disputeItemBaseSchema
	.partial()
	.refine((value) => Object.values(value).some((field) => field !== undefined), {
		message: "At least one field is required",
	});

export const disputeLetterCreateSchema = z.object({
	disputeItemId: z.string().uuid(),
	roundNumber: z.coerce.number().int().min(1).max(10).optional(),
	type: disputeLetterTypeSchema.optional(),
	status: z.string().max(40).optional(),
	recipientName: z.string().max(150).optional().or(z.literal("")),
	letterText: z.string().min(1),
	metadata: z.string().max(5000).optional().or(z.literal("")),
	sentAt: z.coerce.date().optional(),
});

export const clientDocumentCreateSchema = z.object({
	disputeItemId: z.string().uuid().optional(),
	creditReportId: z.string().uuid().optional(),
	documentType: clientDocumentTypeSchema.optional(),
	fileName: z.string().min(1).max(255),
	fileUrl: z.string().min(1),
	mimeType: z.string().max(100).optional().or(z.literal("")),
	notes: z.string().max(5000).optional().or(z.literal("")),
});

export const creditReportReadSchema = z.object({
	clientId: z.string().uuid(),
});
