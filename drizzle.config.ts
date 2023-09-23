import { type Config } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not set");
}

export default {
  schema: "./server/db/schema.ts",
  driver: "mysql2",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  tablesFilter: ["catmash_*"],
} satisfies Config;
