import "dotenv/config";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePgLite } from "drizzle-orm/pglite";

import { schema } from "./schema/schema";

/**
process.env.DEV_MODE === "true" &&
  process.env.USE_PGLITE_DATABASE_CONNECTION === "true"
    ? (drizzlePgLite("./dist/pglite_database", {
        schema: schema,
      }) as unknown as NodePgDatabase<typeof schema>)
    : drizzle(process.env.DATABASE_URL!, {
        schema: schema,
      });
**/

const db = drizzle(process.env.DATABASE_URL!, {
  schema: schema
});

export default db;
