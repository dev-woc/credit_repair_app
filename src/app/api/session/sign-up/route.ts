import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { agencies, teamMembers } from "@/lib/db/schema";
import { agencySchema } from "@/lib/validations";

const signUpSchema = agencySchema.extend({
	email: z.string().email("Please enter a valid email"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	const result = signUpSchema.safeParse(body);

	if (!result.success) {
		return NextResponse.json(
			{ error: result.error.issues[0]?.message ?? "Invalid signup data" },
			{ status: 400 },
		);
	}

	const slugTaken = await db.query.agencies.findFirst({
		where: eq(agencies.slug, result.data.slug),
	});
	if (slugTaken) {
		return NextResponse.json({ error: "Slug is already taken" }, { status: 409 });
	}

	const auth = getAuth();
	const { error: signUpError } = await auth.signUp.email({
		email: result.data.email,
		password: result.data.password,
		name: result.data.name,
	});

	if (signUpError) {
		return NextResponse.json(
			{ error: signUpError.message || "Failed to create account" },
			{ status: signUpError.status || 400 },
		);
	}

	const { data: sessionData, error: sessionError } = await auth.getSession();
	if (sessionError || !sessionData?.user) {
		return NextResponse.json(
			{ error: "Account created, but session could not be established" },
			{ status: 500 },
		);
	}

	const existingAgency = await db.query.agencies.findFirst({
		where: eq(agencies.ownerId, sessionData.user.id),
	});
	if (existingAgency) {
		return NextResponse.json({ agency: existingAgency }, { status: 200 });
	}

	const [agency] = await db
		.insert(agencies)
		.values({
			ownerId: sessionData.user.id,
			name: result.data.name,
			slug: result.data.slug,
		})
		.returning();

	await db.insert(teamMembers).values({
		agencyId: agency.id,
		userId: sessionData.user.id,
		role: "owner",
	});

	return NextResponse.json({ agency }, { status: 201 });
}
