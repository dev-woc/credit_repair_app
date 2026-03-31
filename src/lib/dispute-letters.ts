import type { Agency, Client } from "@/types";

export type CreditBureau = "equifax" | "experian" | "transunion";

export type DisputeLetterStage = "initial" | "follow_up" | "escalation";

export type DisputeItemStatus =
	| "identified"
	| "drafted"
	| "sent"
	| "responded"
	| "verified"
	| "removed"
	| "escalated";

export interface DisputeLetterItem {
	bureau: CreditBureau | string;
	status: DisputeItemStatus | string;
	round: number;
	reason: string;
	accountName?: string | null;
	accountNumberLast4?: string | null;
	referenceId?: string | null;
	evidenceSummary?: string | null;
	dueDate?: Date | string | null;
	notes?: string | null;
}

export interface DisputeLetterDraft {
	stage: DisputeLetterStage;
	subject: string;
	salutation: string;
	body: string;
	letterhead: string;
	metadata: {
		bureau: string;
		round: number;
		status: string;
		generatedAt: string;
	};
}

function toDate(value: Date | string | null | undefined): Date | null {
	if (!value) return null;
	return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: Date | string): string {
	const date = toDate(value);
	if (!date || Number.isNaN(date.getTime())) {
		throw new Error("Invalid date provided");
	}

	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	}).format(date);
}

export function formatBureauName(bureau: CreditBureau | string): string {
	switch (bureau.toLowerCase()) {
		case "equifax":
			return "Equifax";
		case "experian":
			return "Experian";
		case "transunion":
			return "TransUnion";
		default:
			return bureau
				.split(/[ _-]+/)
				.filter(Boolean)
				.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
				.join(" ");
	}
}

export function getDisputeLetterStage(
	item: Pick<DisputeLetterItem, "round" | "status">,
): DisputeLetterStage {
	if (item.status === "escalated" || item.round >= 3) return "escalation";
	if (item.status === "responded" || item.round >= 2) return "follow_up";
	return "initial";
}

function formatItemReference(item: DisputeLetterItem): string[] {
	const parts: string[] = [];

	if (item.accountName?.trim()) parts.push(item.accountName.trim());
	if (item.accountNumberLast4?.trim()) parts.push(`Acct ending ${item.accountNumberLast4.trim()}`);
	if (item.referenceId?.trim()) parts.push(`Reference ${item.referenceId.trim()}`);

	return parts;
}

function stageParagraph(
	stage: DisputeLetterStage,
	bureauName: string,
	dueDate: string | null,
): string {
	if (stage === "initial") {
		return `This is our initial dispute regarding inaccurate, incomplete, or unverifiable information reported by ${bureauName}. Please conduct a reinvestigation under the Fair Credit Reporting Act and delete or correct any item that cannot be verified.`;
	}

	if (stage === "follow_up") {
		const deadlineClause = dueDate ? ` The prior follow-up deadline was ${dueDate}.` : "";
		return `This follow-up request concerns the same disputed item.${deadlineClause} The requested reinvestigation has not resolved the issue, so we ask that you review all available source documentation and verify the reporting with original records only.`;
	}

	return `This escalation follows a prior dispute cycle that has not produced a complete and accurate resolution. Please treat this matter as a formal escalation and preserve all records, source data, and reinvestigation notes related to the disputed item.`;
}

function requestedActionParagraph(stage: DisputeLetterStage): string {
	if (stage === "initial") {
		return "We request deletion or correction of any item that cannot be independently verified, along with written confirmation of the outcome.";
	}

	if (stage === "follow_up") {
		return "We request a renewed reinvestigation and a complete response identifying the source documents relied upon in the prior review.";
	}

	return "We request immediate supervisory review, full documentation of prior reinvestigation steps, and prompt correction or deletion of the disputed item if verification cannot be demonstrated.";
}

function closingParagraph(
	agency: Agency,
	client: Client,
	item: DisputeLetterItem,
	generatedAt: string,
): string {
	const bureauName = formatBureauName(item.bureau);
	const referenceParts = formatItemReference(item);
	const referenceText =
		referenceParts.length > 0 ? ` Item details: ${referenceParts.join(" | ")}.` : "";
	const evidenceText = item.evidenceSummary?.trim()
		? ` Supporting evidence summary: ${item.evidenceSummary.trim()}.`
		: "";
	const notesText = item.notes?.trim() ? ` Internal notes: ${item.notes.trim()}.` : "";

	return [
		`Prepared for ${client.firstName} ${client.lastName} by ${agency.name} on ${generatedAt}.`,
		`This letter is directed to ${bureauName}.${referenceText}${evidenceText}${notesText}`,
	].join(" ");
}

export function generateDisputeLetter(
	agency: Agency,
	client: Client,
	item: DisputeLetterItem,
	generatedAt: Date = new Date(),
): DisputeLetterDraft {
	const stage = getDisputeLetterStage(item);
	const bureauName = formatBureauName(item.bureau);
	const generatedDate = formatDate(generatedAt);
	const dueDate = toDate(item.dueDate);
	const dueDateText = dueDate && !Number.isNaN(dueDate.getTime()) ? formatDate(dueDate) : null;

	const subjectPrefix = {
		initial: "Initial Dispute",
		follow_up: "Follow-Up Dispute",
		escalation: "Escalation Notice",
	}[stage];

	const refParts = formatItemReference(item);
	const referenceSuffix = refParts.length > 0 ? ` - ${refParts.join(" / ")}` : "";

	const body = [
		`${agency.name}`,
		`${client.firstName} ${client.lastName}`,
		`${bureauName} Credit Bureau`,
		"",
		`Re: ${subjectPrefix}${referenceSuffix}`,
		"",
		stageParagraph(stage, bureauName, dueDateText),
		"",
		`Dispute reason: ${item.reason.trim()}`,
		`Requested action: ${requestedActionParagraph(stage)}`,
		item.evidenceSummary?.trim() ? `Evidence summary: ${item.evidenceSummary.trim()}` : null,
		dueDateText ? `Follow-up due date: ${dueDateText}` : null,
		"",
		closingParagraph(agency, client, item, generatedDate),
	]
		.filter((line): line is string => line !== null)
		.join("\n");

	return {
		stage,
		subject: `${subjectPrefix}: ${bureauName}${referenceSuffix}`,
		salutation: `To Whom It May Concern at ${bureauName}:`,
		body,
		letterhead: `${agency.name} | ${client.firstName} ${client.lastName} | ${generatedDate}`,
		metadata: {
			bureau: bureauName,
			round: item.round,
			status: item.status,
			generatedAt: generatedDate,
		},
	};
}
