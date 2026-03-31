import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuth } from "@/lib/auth/server";

const signInSchema = z.object({
	email: z.string().email("Please enter a valid email"),
	password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => null);
		const result = signInSchema.safeParse(body);

		if (!result.success) {
			return NextResponse.json(
				{ error: result.error.issues[0]?.message ?? "Invalid login data" },
				{ status: 400 },
			);
		}

		const { error } = await getAuth().signIn.email({
			email: result.data.email,
			password: result.data.password,
		});

		if (error) {
			return NextResponse.json(
				{ error: error.message || "Invalid email or password" },
				{ status: error.status || 401 },
			);
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Session login failed", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unexpected error while signing in" },
			{ status: 500 },
		);
	}
}
