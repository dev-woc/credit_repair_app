import { describe, expect, it } from "vitest";
import type { Agency, Client } from "@/types";
import {
	formatBureauName,
	formatDate,
	generateDisputeLetter,
	getDisputeLetterStage,
} from "../dispute-letters";

const agency = {
	id: "agency-1",
	ownerId: "owner-1",
	name: "Credit Fix Pro",
	slug: "credit-fix-pro",
	plan: "starter",
	createdAt: new Date("2026-03-01T00:00:00.000Z"),
	updatedAt: new Date("2026-03-01T00:00:00.000Z"),
} satisfies Agency;

const client = {
	id: "client-1",
	agencyId: "agency-1",
	firstName: "Jordan",
	lastName: "Mason",
	email: "jordan@example.com",
	phone: "555-0100",
	goals: "credit_card,general",
	status: "active",
	notes: "Client wants to remove unverifiable collection items.",
	createdAt: new Date("2026-03-02T00:00:00.000Z"),
	updatedAt: new Date("2026-03-02T00:00:00.000Z"),
} satisfies Client;

describe("formatBureauName", () => {
	it("normalizes bureau names", () => {
		expect(formatBureauName("equifax")).toBe("Equifax");
		expect(formatBureauName("experian")).toBe("Experian");
		expect(formatBureauName("transunion")).toBe("TransUnion");
		expect(formatBureauName("consumer reporting agency")).toBe("Consumer Reporting Agency");
	});
});

describe("formatDate", () => {
	it("formats dates in UTC for deterministic output", () => {
		expect(formatDate(new Date("2026-04-15T12:00:00.000Z"))).toBe("April 15, 2026");
	});
});

describe("getDisputeLetterStage", () => {
	it("maps round and status to the expected stage", () => {
		expect(getDisputeLetterStage({ round: 1, status: "identified" })).toBe("initial");
		expect(getDisputeLetterStage({ round: 2, status: "responded" })).toBe("follow_up");
		expect(getDisputeLetterStage({ round: 3, status: "sent" })).toBe("escalation");
		expect(getDisputeLetterStage({ round: 1, status: "escalated" })).toBe("escalation");
	});
});

describe("generateDisputeLetter", () => {
	it("generates an initial dispute letter with the item context", () => {
		const letter = generateDisputeLetter(
			agency,
			client,
			{
				bureau: "experian",
				status: "identified",
				round: 1,
				reason: "Inaccurate collection reporting",
				accountName: "Acme Collections",
				accountNumberLast4: "1234",
				referenceId: "EXP-7781",
				evidenceSummary: "Bank statements and prior correspondence support deletion.",
				dueDate: "2026-04-30T00:00:00.000Z",
				notes: "Send with supporting docs",
			},
			new Date("2026-04-01T00:00:00.000Z"),
		);

		expect(letter.stage).toBe("initial");
		expect(letter.subject).toBe(
			"Initial Dispute: Experian - Acme Collections / Acct ending 1234 / Reference EXP-7781",
		);
		expect(letter.salutation).toBe("To Whom It May Concern at Experian:");
		expect(letter.body).toContain("Credit Fix Pro");
		expect(letter.body).toContain("Jordan Mason");
		expect(letter.body).toContain("Inaccurate collection reporting");
		expect(letter.body).toContain("Acme Collections");
		expect(letter.body).toContain("Acct ending 1234");
		expect(letter.body).toContain(
			"Evidence summary: Bank statements and prior correspondence support deletion.",
		);
		expect(letter.body).toContain("Follow-up due date: April 30, 2026");
		expect(letter.metadata).toEqual({
			bureau: "Experian",
			round: 1,
			status: "identified",
			generatedAt: "April 1, 2026",
		});
	});

	it("generates follow-up and escalation variants from later rounds", () => {
		const followUp = generateDisputeLetter(
			agency,
			client,
			{
				bureau: "equifax",
				status: "responded",
				round: 2,
				reason: "Verification failed to match the furnisher record",
				referenceId: "EQ-221",
				dueDate: "2026-05-12T00:00:00.000Z",
			},
			new Date("2026-05-01T00:00:00.000Z"),
		);

		expect(followUp.stage).toBe("follow_up");
		expect(followUp.subject).toContain("Follow-Up Dispute: Equifax");
		expect(followUp.body).toContain("follow-up request");
		expect(followUp.body).toContain("Follow-up due date: May 12, 2026");

		const escalation = generateDisputeLetter(
			agency,
			client,
			{
				bureau: "transunion",
				status: "escalated",
				round: 3,
				reason: "Repeated reinvestigation did not resolve the issue",
			},
			new Date("2026-05-20T00:00:00.000Z"),
		);

		expect(escalation.stage).toBe("escalation");
		expect(escalation.subject).toBe("Escalation Notice: TransUnion");
		expect(escalation.body).toContain("formal escalation");
		expect(escalation.body).toContain("Repeated reinvestigation did not resolve the issue");
	});
});
