import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { agencies, teamMembers } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";
import { agencySchema } from "@/lib/validations";

async function getUser() {
	const { data } = await getAuth().getSession();
	return data?.user ?? null;
}

export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const user = await getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const agency = await db.query.agencies.findFirst({
		where: eq(agencies.ownerId, user.id),
		with: { teamMembers: true },
	});

	return NextResponse.json({ agency: agency ?? null });
}

export async function POST(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const user = await getUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Idempotent — return existing agency if already created
	const existing = await db.query.agencies.findFirst({
		where: eq(agencies.ownerId, user.id),
	});
	if (existing) return NextResponse.json({ agency: existing }, { status: 200 });

	const body = await request.json();
	const result = agencySchema.safeParse(body);
	if (!result.success) {
		return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
	}

	const slugTaken = await db.query.agencies.findFirst({
		where: eq(agencies.slug, result.data.slug),
	});
	if (slugTaken) {
		return NextResponse.json({ error: "Slug is already taken" }, { status: 409 });
	}

	const [agency] = await db
		.insert(agencies)
		.values({ ownerId: user.id, name: result.data.name, slug: result.data.slug })
		.returning();

	await db.insert(teamMembers).values({
		agencyId: agency.id,
		userId: user.id,
		role: "owner",
	});

	return NextResponse.json({ agency }, { status: 201 });
}
