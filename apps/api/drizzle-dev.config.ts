import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig(
  process.env.DEV_MODE && process.env.USE_PGLITE_DATABASE_CONNECTION
    ? {
        out: "./db/drizzle",
        driver: "pglite",
        schema: "./db/schema/schema.ts",
        dialect: "postgresql",
        dbCredentials: {
          url: "./dist/pglite_database",
        },
      }
    : {
        out: "./db/drizzle",
        schema: "./db/schema/schema.ts",
        dialect: "postgresql",
        dbCredentials: {
          url: "postgres://postgres:loqui_test_db-password@localhost:3984/postgres",
        },
      },
);
