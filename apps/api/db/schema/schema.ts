import {integer, jsonb, pgEnum, pgTable, primaryKey, serial, text, timestamp, varchar} from "drizzle-orm/pg-core";
import {relations} from "drizzle-orm";


////--- Enums ---////

export const userRoleEnum = pgEnum("USER_ROLE", ["translator", "approved", "moderator", "admin"]);
export const proposalStatusEnum = pgEnum("PROPOSAL_STATUS", ["removed", "inaccurate", "pending", "accurate"]);


////--- Tables ---////

// A user, can be a translator, approved translator, moderator or admin
export const user = pgTable("user", {
    id: varchar("id", {length: 255}).notNull().primaryKey(),                // Modrinth user id
    role: userRoleEnum("role").notNull().default("translator"),             // Default to translator
    reputation: integer("reputation").notNull().default(1),                 // Default to 1
    banned: timestamp("banned"),                                            // User is banned if this is not null
});

// A project that has opted in to translations
export const project = pgTable("project", {
    id: varchar("id", {length: 255}).notNull().primaryKey(),                // Modrinth project id
    optIn: timestamp("opt-in", {withTimezone: true}),                       // When the project opted in
});

// A version of a project
export const version = pgTable("version", {
    id: varchar("id", {length: 255}).notNull().primaryKey(),                // Modrinth version id
    projectId: varchar("project_id", {length: 255}).notNull()               // -> Projects Modrinth project id
        .references(() => project.id, {onDelete: 'cascade'})
});

// version <-> item many-to-many relationship
export const versionToItem = pgTable('version_to_item', {
    versionId: varchar("version_id", {length: 255}).notNull(),              // -> Modrinth version id
    itemId: integer("item_id").notNull(),                                   // -> Items id
}, (t) => [primaryKey({columns: [t.versionId, t.itemId]})]);

// The base of the translations. Storing the translation key and the default value from en_us.
export const item = pgTable("item", {
    id: serial("id").notNull().primaryKey(),                                // Generic serial id
    key: text("key").notNull(),                                             // Key of the translation item (e.g. "block.spectrum.citrine_ore")
    value: text("value").notNull(),                                         // Value of the translation item in en_us (e.g. "Citrine Ore")
});

// user <-> language many-to-many relationship (approved user languages)
export const approvedUserLanguages = pgTable('approved_user_languages', {
    userId: varchar("user_id", {length: 255}).notNull(),                    // -> User id
    languageCode: varchar("language_code", {length: 10}).notNull(),         // -> Language code
}, (t) => [primaryKey({columns: [t.userId, t.languageCode]})]);

// A language that translations can be in
export const language = pgTable("language", {
    code: varchar("code", {length: 10}).notNull().unique(),                 // Language code (e.g. "de_de")
    name: text("name").notNull(),                                           // Name of the language (e.g. "German")
    nativeName: text("native_name").notNull(),                              // Native name of the language (e.g. "Deutsch")
    suggestionMeta: jsonb("suggestion_meta").notNull().default({}),         // Metadata for automatic suggestions
});

// A translation of an item in a language
export const translation = pgTable("translation", {
    id: serial("id").notNull().primaryKey(),                                // Generic serial id
    itemId: integer("item_id").notNull()                                    // -> Item id
        .references(() => item.id, {onDelete: 'cascade'}),
    languageCode: varchar("language_code", { length: 10 }).notNull()        // -> Language code
        .references(() => language.code, { onDelete: 'no action' }),
    userId: varchar("user_id", { length: 255 })                             // -> User id
        .references(() => user.id, { onDelete: 'cascade' }),
});

// A proposal for a translation
export const proposal = pgTable("proposal", {
    id: serial("id").notNull().primaryKey(),                                // Generic serial id
    userId: varchar("user_id", { length: 255 }).notNull()                   // -> User id
        .references(() => user.id, { onDelete: 'cascade' }),
    value: text("value").notNull(),                                         // Proposed translation (eg. "Citrin Erz")
    note: text("note"),                                                     // Note from the user (not required)
    status: proposalStatusEnum("status").notNull(),                         // Status of the proposal
    translationId: integer("translation_id").notNull()                      // -> Translation id
        .references(() => translation.id, { onDelete: 'cascade' }),
});


////--- Relations ---////

// User relations
export const userRelations = relations(user, ({ many }) => ({
    translations: many(translation),
    proposals: many(proposal),
    approvedUserLanguages: many(approvedUserLanguages)
}));

// Project relations
export const projectRelations = relations(project, ({ many }) => ({
    versions: many(version),
}));

// Version relations
export const versionRelations = relations(version, ({ one, many }) => ({
    project: one(project, {
        fields: [version.projectId],
        references: [project.id],
    }),
    versionToItems: many(versionToItem),
}));

// VersionToItem relations (junction table)
export const versionToItemRelations = relations(versionToItem, ({ one }) => ({
    version: one(version, {
        fields: [versionToItem.versionId],
        references: [version.id],
    }),
    item: one(item, {
        fields: [versionToItem.itemId],
        references: [item.id],
    }),
}));

// approvedUserLanguages relations (junction table)
export const approvedUserLanguagesRelations = relations(approvedUserLanguages, ({ one }) => ({
    user: one(user, {
        fields: [approvedUserLanguages.userId],
        references: [user.id],
    }),
    language: one(language, {
        fields: [approvedUserLanguages.languageCode],
        references: [language.code],
    }),
}));

// Item relations
export const itemRelations = relations(item, ({ many }) => ({
    translations: many(translation),
    versionToItems: many(versionToItem),
}));

// Language relations
export const languageRelations = relations(language, ({ many }) => ({
    translations: many(translation),
    approvedUserLanguages: many(approvedUserLanguages),
}));

// Translation relations
export const translationRelations = relations(translation, ({ one, many }) => ({
    item: one(item, {
        fields: [translation.itemId],
        references: [item.id],
    }),
    language: one(language, {
        fields: [translation.languageCode],
        references: [language.code],
    }),
    user: one(user, {
        fields: [translation.userId],
        references: [user.id],
    }),
    proposals: many(proposal),
}));

// Proposal relations
export const proposalRelations = relations(proposal, ({ one }) => ({
    user: one(user, {
        fields: [proposal.userId],
        references: [user.id],
    }),
    translation: one(translation, {
        fields: [proposal.translationId],
        references: [translation.id],
    }),
}));

/*
Examples from:
- https://github.com/DaFuqs/Spectrum/blob/1.20.1-aria-for-painters/src/main/resources/assets/spectrum/lang
 */

export const schema = {
    user,
    project,
    version,
    versionToItem,
    item,
    language,
    approvedUserLanguages,
    translation,
    proposal,
    userRelations,
    projectRelations,
    versionRelations,
    versionToItemRelations,
    itemRelations,
    languageRelations,
    translationRelations,
    proposalRelations,
    approvedUserLanguagesRelations,
}
