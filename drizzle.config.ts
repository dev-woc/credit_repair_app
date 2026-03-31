import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required");
}

const parsedUrl = new URL(databaseUrl);
const isLocalDatabase =
	parsedUrl.hostname === "localhost" ||
	parsedUrl.hostname === "127.0.0.1" ||
	parsedUrl.hostname === "::1";

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/lib/db/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		host: parsedUrl.hostname,
		port: parsedUrl.port ? Number(parsedUrl.port) : 5432,
		user: decodeURIComponent(parsedUrl.username),
		password: decodeURIComponent(parsedUrl.password),
		database: parsedUrl.pathname.replace(/^\//, ""),
		ssl: isLocalDatabase ? false : "require",
	},
});
