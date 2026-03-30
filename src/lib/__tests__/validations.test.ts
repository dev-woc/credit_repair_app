import { describe, expect, it } from "vitest";
import { agencySchema, agencySlugSchema, clientIntakeSchema } from "../validations";

describe("agencySlugSchema", () => {
	it("accepts valid slugs", () => {
		expect(agencySlugSchema.safeParse("my-agency").success).toBe(true);
		expect(agencySlugSchema.safeParse("agency123").success).toBe(true);
		expect(agencySlugSchema.safeParse("a1b").success).toBe(true);
	});

	it("rejects slugs that are too short (2 chars)", () => {
		expect(agencySlugSchema.safeParse("ab").success).toBe(false);
	});

	it("rejects reserved slugs", () => {
		expect(agencySlugSchema.safeParse("dashboard").success).toBe(false);
		expect(agencySlugSchema.safeParse("admin").success).toBe(false);
		expect(agencySlugSchema.safeParse("login").success).toBe(false);
	});

	it("rejects uppercase slugs", () => {
		expect(agencySlugSchema.safeParse("MyAgency").success).toBe(false);
		expect(agencySlugSchema.safeParse("AGENCY").success).toBe(false);
	});

	it("rejects slugs starting with a hyphen", () => {
		expect(agencySlugSchema.safeParse("-my-agency").success).toBe(false);
	});

	it("rejects slugs ending with a hyphen", () => {
		expect(agencySlugSchema.safeParse("my-agency-").success).toBe(false);
	});
});

describe("agencySchema", () => {
	it("accepts a valid agency with name and slug", () => {
		const result = agencySchema.safeParse({
			name: "Credit Fix Pro",
			slug: "credit-fix-pro",
		});
		expect(result.success).toBe(true);
	});

	it("rejects name that is too short (1 char)", () => {
		const result = agencySchema.safeParse({
			name: "A",
			slug: "valid-slug",
		});
		expect(result.success).toBe(false);
	});

	it("rejects reserved slug in agency", () => {
		const result = agencySchema.safeParse({
			name: "Dashboard Agency",
			slug: "dashboard",
		});
		expect(result.success).toBe(false);
	});
});

describe("clientIntakeSchema", () => {
	it("accepts all valid fields with multiple goals", () => {
		const result = clientIntakeSchema.safeParse({
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
			phone: "555-1234",
			goals: ["mortgage", "auto_loan"],
			notes: "Wants to buy a house",
		});
		expect(result.success).toBe(true);
	});

	it("accepts without phone (optional)", () => {
		const result = clientIntakeSchema.safeParse({
			firstName: "Jane",
			lastName: "Doe",
			email: "jane@example.com",
			goals: ["general"],
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing firstName", () => {
		const result = clientIntakeSchema.safeParse({
			lastName: "Doe",
			email: "test@example.com",
			goals: ["general"],
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid email", () => {
		const result = clientIntakeSchema.safeParse({
			firstName: "John",
			lastName: "Doe",
			email: "not-an-email",
			goals: ["general"],
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty goals array", () => {
		const result = clientIntakeSchema.safeParse({
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
			goals: [],
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid goal value", () => {
		const result = clientIntakeSchema.safeParse({
			firstName: "John",
			lastName: "Doe",
			email: "john@example.com",
			goals: ["invalid_goal"],
		});
		expect(result.success).toBe(false);
	});
});
