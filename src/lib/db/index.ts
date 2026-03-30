import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb(url: string) {
	const sql = neon(url);
	return drizzle(sql, { schema });
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
