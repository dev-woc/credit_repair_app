import { authApiHandler } from "@neondatabase/auth/next/server";

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
	return authApiHandler().GET(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
	return authApiHandler().POST(request, context);
}
