const HOP_BY_HOP_HEADERS = new Set([
	"connection",
	"content-encoding",
	"content-length",
	"date",
	"keep-alive",
	"set-cookie",
	"transfer-encoding",
]);

const REQUEST_HEADER_ALLOWLIST = [
	"accept",
	"accept-language",
	"authorization",
	"content-type",
	"origin",
	"referer",
	"user-agent",
] as const;

function getAuthBaseUrl() {
	const baseUrl = process.env.NEON_AUTH_BASE_URL;
	if (!baseUrl) {
		throw new Error("NEON_AUTH_BASE_URL environment variable is required");
	}

	return baseUrl.replace(/\/$/, "");
}

function buildUpstreamHeaders(request: Request) {
	const headers = new Headers();

	for (const header of REQUEST_HEADER_ALLOWLIST) {
		const value = request.headers.get(header);
		if (value) headers.set(header, value);
	}

	const cookie = request.headers.get("cookie");
	if (cookie) headers.set("cookie", cookie);

	headers.set("x-neon-auth-proxy", "nextjs");
	return headers;
}

async function proxyAuthRequest(
	request: Request,
	context: { params: Promise<{ path: string[] }> },
) {
	const { path } = await context.params;
	const upstreamUrl = new URL(`${getAuthBaseUrl()}/${path.join("/")}`);
	upstreamUrl.search = new URL(request.url).search;

	const upstreamResponse = await fetch(upstreamUrl, {
		method: request.method,
		headers: buildUpstreamHeaders(request),
		body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
		redirect: "manual",
	});

	const responseHeaders = new Headers();
	for (const [name, value] of upstreamResponse.headers.entries()) {
		if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
			responseHeaders.append(name, value);
		}
	}

	if (typeof upstreamResponse.headers.getSetCookie === "function") {
		for (const cookie of upstreamResponse.headers.getSetCookie()) {
			responseHeaders.append("set-cookie", cookie);
		}
	} else {
		const cookieHeader = upstreamResponse.headers.get("set-cookie");
		if (cookieHeader) responseHeaders.set("set-cookie", cookieHeader);
	}

	return new Response(upstreamResponse.body, {
		status: upstreamResponse.status,
		statusText: upstreamResponse.statusText,
		headers: responseHeaders,
	});
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
	return proxyAuthRequest(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
	return proxyAuthRequest(request, context);
}

export async function PUT(request: Request, context: { params: Promise<{ path: string[] }> }) {
	return proxyAuthRequest(request, context);
}

export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
	return proxyAuthRequest(request, context);
}

export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
	return proxyAuthRequest(request, context);
}
