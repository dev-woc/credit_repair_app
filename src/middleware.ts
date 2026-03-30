import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	const allCookies = request.cookies.getAll();
	const sessionCookie = allCookies.find((c) => c.name.includes("neon-auth.session_token"));

	if (!sessionCookie?.value) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/clients/:path*", "/settings/:path*"],
};
