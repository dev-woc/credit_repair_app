import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { generateCroaContract } from "@/lib/contract-templates";
import { db } from "@/lib/db";
import { agencies, clientContracts, clients } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";
import { clientIntakeSchema } from "@/lib/validations";

async function getUser() {
	const { data } = await getAuth().getSession();
	return data?.user ?? null;
}

async function getAgency(userId: string) {
	return db.query.agencies.findFirst({ where: eq(agencies.ownerId, userId) });
}

export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const user = await getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const agency = await getAgency(user.id);
	if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

	const clientList = await db.query.clients.findMany({
		where: eq(clients.agencyId, agency.id),
		with: { contract: true },
		orderBy: [desc(clients.createdAt)],
	});

	return NextResponse.json({ clients: clientList });
}

export async function POST(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const user = await getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const agency = await getAgency(user.id);
	if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

	const body = await request.json();
	const result = clientIntakeSchema.safeParse(body);
	if (!result.success) {
		return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
	}

	const { firstName, lastName, email, phone, goals, notes } = result.data;
	const goalsStr = goals.join(",");

	const contractText = generateCroaContract(agency, {
		firstName,
		lastName,
		email,
		phone: phone ?? "",
		goals: goalsStr,
		status: "active",
		notes: notes ?? "",
	});

	const txResult = await db.transaction(async (tx) => {
		const [client] = await tx
			.insert(clients)
			.values({
				agencyId: agency.id,
				firstName,
				lastName,
				email,
				phone: phone ?? "",
				goals: goalsStr,
				notes: notes ?? "",
			})
			.returning();

		const [contract] = await tx
			.insert(clientContracts)
			.values({
				clientId: client.id,
				agencyId: agency.id,
				contractText,
			})
			.returning();

		return { client, contract };
	});

	return NextResponse.json(txResult, { status: 201 });
}
