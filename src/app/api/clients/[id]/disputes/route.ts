import { and, desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
	agencies,
	clientDocuments,
	clients,
	creditReports,
	disputeItems,
	disputeLetters,
	tradelines,
} from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";
import { disputeItemCreateSchema } from "@/lib/validations";

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const user = await getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const agency = await getAgency(user.id);
	if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

	const { id } = await params;
	const client = await getClient(agency.id, id);
	if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

	const [creditReportRows, disputeItemRows, disputeLetterRows, documentRows] = await Promise.all([
		db.query.creditReports.findMany({
			where: eq(creditReports.clientId, client.id),
			with: { tradelines: true },
			orderBy: [desc(creditReports.reportDate)],
		}),
		db.query.disputeItems.findMany({
			where: eq(disputeItems.clientId, client.id),
			with: {
				creditReport: true,
				tradeline: true,
				letters: true,
				documents: true,
			},
			orderBy: [desc(disputeItems.createdAt)],
		}),
		db.query.disputeLetters.findMany({
			where: eq(disputeLetters.clientId, client.id),
			orderBy: [desc(disputeLetters.generatedAt)],
		}),
		db.query.clientDocuments.findMany({
			where: eq(clientDocuments.clientId, client.id),
			orderBy: [desc(clientDocuments.uploadedAt)],
		}),
	]);
	const tradelineRows = creditReportRows.flatMap((report) => report.tradelines);

	return NextResponse.json({
		clientId: client.id,
		creditReports: creditReportRows,
		tradelines: tradelineRows,
		disputeItems: disputeItemRows,
		disputeLetters: disputeLetterRows,
		clientDocuments: documentRows,
	});
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const user = await getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const agency = await getAgency(user.id);
	if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

	const { id } = await params;
	const client = await getClient(agency.id, id);
	if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

	const body = await request.json();
	const result = disputeItemCreateSchema.safeParse(body);
	if (!result.success) {
		return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
	}

	if (result.data.creditReportId) {
		const report = await db.query.creditReports.findFirst({
			where: and(
				eq(creditReports.id, result.data.creditReportId),
				eq(creditReports.clientId, client.id),
				eq(creditReports.agencyId, agency.id),
			),
		});
		if (!report) {
			return NextResponse.json({ error: "Credit report not found" }, { status: 404 });
		}
	}

	if (result.data.tradelineId) {
		const tradeline = await db.query.tradelines.findFirst({
			where: and(
				eq(tradelines.id, result.data.tradelineId),
				eq(tradelines.clientId, client.id),
				eq(tradelines.agencyId, agency.id),
			),
		});
		if (!tradeline) {
			return NextResponse.json({ error: "Tradeline not found" }, { status: 404 });
		}
		if (result.data.creditReportId && tradeline.creditReportId !== result.data.creditReportId) {
			return NextResponse.json(
				{ error: "Tradeline does not belong to the selected credit report" },
				{ status: 400 },
			);
		}
	}

	const [disputeItem] = await db
		.insert(disputeItems)
		.values({
			agencyId: agency.id,
			clientId: client.id,
			creditReportId: result.data.creditReportId ?? null,
			tradelineId: result.data.tradelineId ?? null,
			bureau: result.data.bureau,
			status: result.data.status ?? "identified",
			roundNumber: result.data.roundNumber ?? 1,
			reason: result.data.reason,
			evidenceSummary: result.data.evidenceSummary ?? "",
			notes: result.data.notes ?? "",
			dueDate: result.data.dueDate ?? null,
			sentAt: result.data.sentAt ?? null,
			respondedAt: result.data.respondedAt ?? null,
			resolvedAt: result.data.resolvedAt ?? null,
		})
		.returning();

	return NextResponse.json({ disputeItem }, { status: 201 });
}
