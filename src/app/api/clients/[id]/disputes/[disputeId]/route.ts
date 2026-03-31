import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { agencies, clients, disputeItems } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";
import { disputeItemUpdateSchema } from "@/lib/validations";

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
			creditReport: true,
			tradeline: true,
			letters: true,
			documents: true,
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

	return NextResponse.json({ disputeItem });
}

export async function PATCH(
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

	const body = await request.json();
	const result = disputeItemUpdateSchema.safeParse(body);
	if (!result.success) {
		return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
	}

	const nextStatus = result.data.status ?? disputeItem.status;
	const updates: Record<string, unknown> = {
		...result.data,
		updatedAt: new Date(),
	};

	if (result.data.status === "sent" && !result.data.sentAt && !disputeItem.sentAt) {
		updates.sentAt = new Date();
	}
	if (result.data.status === "responded" && !result.data.respondedAt && !disputeItem.respondedAt) {
		updates.respondedAt = new Date();
	}
	if (
		["verified", "removed", "closed"].includes(nextStatus) &&
		!result.data.resolvedAt &&
		!disputeItem.resolvedAt
	) {
		updates.resolvedAt = new Date();
	}

	const [updated] = await db
		.update(disputeItems)
		.set(updates)
		.where(and(eq(disputeItems.id, disputeItem.id), eq(disputeItems.agencyId, agency.id)))
		.returning();

	return NextResponse.json({ disputeItem: updated });
}

export async function DELETE(
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

	await db
		.delete(disputeItems)
		.where(and(eq(disputeItems.id, disputeItem.id), eq(disputeItems.agencyId, agency.id)));

	return NextResponse.json({ deleted: true });
}
