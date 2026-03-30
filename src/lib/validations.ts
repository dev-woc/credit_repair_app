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
