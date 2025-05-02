import { migrate } from "drizzle-orm/node-postgres/migrator";
import db from "../index";

async function applyMigrations() {
  console.log("Migrating...");

  try {
    await migrate(db, { migrationsFolder: "./db/drizzle" });
    console.log("Migration complete");
  } catch (error) {
    console.error("Migration failed with following error:", error);
  }
}

export const runMigrations = () => {
  applyMigrations().catch((error) => {
    console.error("Error whilst migrating:", error);
    process.exit(1);
  });
};
