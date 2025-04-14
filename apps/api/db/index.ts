import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePgLite } from "drizzle-orm/pglite";

import { schema } from "./schema/schema";

const db =
  process.env.DEV_MODE && process.env.USE_PGLITE_DATABASE_CONNECTION
    ? drizzlePgLite("./dist/pglite_database", {
        schema: schema,
      })
    : drizzle(process.env.DATABASE_URL!, {
        schema: schema,
      });

export default db;
