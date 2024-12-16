import {integer, pgEnum, pgTable, timestamp, varchar} from "drizzle-orm/pg-core";

const userRoleEnum = pgEnum("USER_ROLE", ["translator", "approved", "moderator", "admin"]);

export const user = pgTable("user", {
    id: varchar("id", { length: 255 }).notNull().unique(),
    role: userRoleEnum("role").notNull(),
    reputation: integer("reputation").notNull().default(1),
    banned: timestamp("banned", { withTimezone: true }),
});