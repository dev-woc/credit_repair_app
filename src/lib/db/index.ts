import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & {
	__creditRepairDbPool?: Pool;
};

function createDb(url: string) {
	const parsedUrl = new URL(url);
	const isLocalDatabase =
		parsedUrl.hostname === "localhost" ||
		parsedUrl.hostname === "127.0.0.1" ||
		parsedUrl.hostname === "::1";
	const pool =
		globalForDb.__creditRepairDbPool ??
		new Pool({
			connectionString: url,
			ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
		});

	if (!globalForDb.__creditRepairDbPool) {
		globalForDb.__creditRepairDbPool = pool;
	}

	return drizzle(pool, { schema });
}

type Database = ReturnType<typeof createDb>;
const databaseUrl = process.env.DATABASE_URL;

export const db: Database = databaseUrl
	? createDb(databaseUrl)
	: new Proxy({} as Database, {
			get() {
				throw new Error("DATABASE_URL is required");
			},
		});
