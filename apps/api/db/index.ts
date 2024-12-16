import { drizzle } from "drizzle-orm/node-postgres";
import {
  project,
  user,
  version,
  versionToItem,
  item,
  language,
  translation,
  proposal,
} from "./schema/schema";

const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    user,
    project,
    version,
    versionToItem,
    item,
    language,
    translation,
    proposal,
  },
});

export default db;
