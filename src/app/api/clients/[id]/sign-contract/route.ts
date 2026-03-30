import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { calculateCancellationDeadline } from "@/lib/contract-templates";
import { db } from "@/lib/db";
import { agencies, clientContracts, clients } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";

async function getUser() {
	const { data } = await getAuth().getSession();
	return data?.user ?? null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const user = await getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const agency = await db.query.agencies.findFirst({
		where: eq(agencies.ownerId, user.id),
	});
	if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

	const { id: clientId } = await params;

	const client = await db.query.clients.findFirst({
		where: and(eq(clients.id, clientId), eq(clients.agencyId, agency.id)),
	});
	if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

	const contract = await db.query.clientContracts.findFirst({
		where: and(eq(clientContracts.clientId, clientId), eq(clientContracts.agencyId, agency.id)),
	});
	if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
	if (contract.status === "signed") {
		return NextResponse.json({ error: "Contract already signed" }, { status: 409 });
	}

	const signedAt = new Date();
	const cancellationDeadline = calculateCancellationDeadline(signedAt);

	const [updated] = await db
		.update(clientContracts)
		.set({ status: "signed", signedAt, cancellationDeadline, updatedAt: new Date() })
		.where(eq(clientContracts.id, contract.id))
		.returning();

	return NextResponse.json({ contract: updated });
}
