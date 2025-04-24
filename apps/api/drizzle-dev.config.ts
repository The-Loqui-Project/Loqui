import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig(
  process.env.DEV_MODE === "true" &&
    process.env.USE_PGLITE_DATABASE_CONNECTION === "true"
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
          url: process.env.DATABASE_URL!,
        },
      },
);
