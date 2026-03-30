import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agencies } from "@/lib/db/schema";
import { apiRateLimiter } from "@/lib/rate-limit";
import { slugCheckSchema, slugSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
	const { success } = apiRateLimiter.check(ip);
	if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const parsed = slugCheckSchema.safeParse({
		slug: request.nextUrl.searchParams.get("slug") ?? "",
	});
	if (!parsed.success) {
		return NextResponse.json({ available: false, error: "Slug is required" }, { status: 400 });
	}

	const validSlug = slugSchema.safeParse(parsed.data.slug);
	if (!validSlug.success) {
		return NextResponse.json(
			{
				available: false,
				error: validSlug.error.issues[0]?.message ?? "Invalid slug",
			},
			{ status: 400 },
		);
	}

	const existing = await db.query.agencies.findFirst({
		where: eq(agencies.slug, validSlug.data),
	});

	return NextResponse.json({ available: !existing });
}
