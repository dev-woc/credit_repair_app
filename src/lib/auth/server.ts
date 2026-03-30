import { createAuthServer } from "@neondatabase/auth/next/server";

export function getAuth() {
	return createAuthServer();
}
