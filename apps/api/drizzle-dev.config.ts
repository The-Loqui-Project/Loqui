import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./db/drizzle",
  schema: "./db/schema/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://postgres:loqui_test_db-password@localhost:5432/postgres",
  },
});
