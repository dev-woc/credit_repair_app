import { and, desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { agencies, clients, disputeItems, disputeLetters } from "@/lib/db/schema";
import { generateDisputeLetter } from "@/lib/dispute-letters";
import { apiRateLimiter } from "@/lib/rate-limit";

async function getUser() {
	const { data } = await getAuth().getSession();
	return data?.user ?? null;
}

async function getAgency(userId: string) {
	return db.query.agencies.findFirst({ where: eq(agencies.ownerId, userId) });
}

async function getClient(agencyId: string, clientId: string) {
	return db.query.clients.findFirst({
		where: and(eq(clients.id, clientId), eq(clients.agencyId, agencyId)),
	});
}

async function getDisputeItem(agencyId: string, clientId: string, disputeId: string) {
	return db.query.disputeItems.findFirst({
		where: and(
			eq(disputeItems.id, disputeId),
			eq(disputeItems.clientId, clientId),
			eq(disputeItems.agencyId, agencyId),
		),
		with: {
			tradeline: true,
		},
	});
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; disputeId: string }> },
) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const user = await getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const agency = await getAgency(user.id);
	if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

	const { id, disputeId } = await params;
	const client = await getClient(agency.id, id);
	if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

	const disputeItem = await getDisputeItem(agency.id, client.id, disputeId);
	if (!disputeItem) return NextResponse.json({ error: "Dispute item not found" }, { status: 404 });

	const letters = await db.query.disputeLetters.findMany({
		where: and(
			eq(disputeLetters.clientId, client.id),
			eq(disputeLetters.disputeItemId, disputeItem.id),
		),
		orderBy: [desc(disputeLetters.generatedAt)],
	});

	return NextResponse.json({ letters });
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; disputeId: string }> },
) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const user = await getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const agency = await getAgency(user.id);
	if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

	const { id, disputeId } = await params;
	const client = await getClient(agency.id, id);
	if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

	const disputeItem = await getDisputeItem(agency.id, client.id, disputeId);
	if (!disputeItem) return NextResponse.json({ error: "Dispute item not found" }, { status: 404 });

	const draft = generateDisputeLetter(agency, client, {
		bureau: disputeItem.bureau,
		status: disputeItem.status,
		round: disputeItem.roundNumber,
		reason: disputeItem.reason,
		accountName: disputeItem.tradeline?.creditorName ?? null,
		accountNumberLast4: disputeItem.tradeline?.accountNumber
			? disputeItem.tradeline.accountNumber.slice(-4)
			: null,
		evidenceSummary: disputeItem.evidenceSummary,
		dueDate: disputeItem.dueDate,
		notes: disputeItem.notes,
	});

	const [letter] = await db
		.insert(disputeLetters)
		.values({
			agencyId: agency.id,
			clientId: client.id,
			disputeItemId: disputeItem.id,
			roundNumber: disputeItem.roundNumber,
			type: draft.stage,
			status: "draft",
			recipientName: draft.metadata.bureau,
			letterText: [draft.subject, draft.salutation, "", draft.body].join("\n"),
			metadata: JSON.stringify({
				...draft.metadata,
				subject: draft.subject,
				salutation: draft.salutation,
				letterhead: draft.letterhead,
			}),
		})
		.returning();

	return NextResponse.json({ letter }, { status: 201 });
}
