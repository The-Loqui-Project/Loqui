import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

import { schema } from "./schema/schema";

const db = drizzle(process.env.DATABASE_URL!, {
  schema: schema,
});

export default db;
