import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { agencies, clients } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";
import { clientUpdateSchema } from "@/lib/validations";

async function getUser() {
	const { data } = await getAuth().getSession();
	return data?.user ?? null;
}

async function getAgency(userId: string) {
	return db.query.agencies.findFirst({ where: eq(agencies.ownerId, userId) });
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
	const client = await db.query.clients.findFirst({
		where: and(eq(clients.id, id), eq(clients.agencyId, agency.id)),
		with: { contract: true },
	});

	if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

	return NextResponse.json({ client });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const user = await getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const agency = await getAgency(user.id);
	if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

	const body = await request.json();
	const result = clientUpdateSchema.safeParse(body);
	if (!result.success) {
		return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
	}

	const { id } = await params;
	const [updated] = await db
		.update(clients)
		.set({ ...result.data, updatedAt: new Date() })
		.where(and(eq(clients.id, id), eq(clients.agencyId, agency.id)))
		.returning();

	if (!updated) return NextResponse.json({ error: "Client not found" }, { status: 404 });

	return NextResponse.json({ client: updated });
}
