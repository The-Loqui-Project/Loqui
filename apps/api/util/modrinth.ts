import axios from "axios";
import { Project, ProjectVersion } from "typerinth";
import db from "../db";
import { eq, inArray, and } from "drizzle-orm";
import { item, version, versionToItem } from "../db/schema/schema";
import downloadJarAndExtractStrings, { TranslationStrings } from "./files";

export async function isProjectValid(
  projectID: string,
): Promise<Project | false> {
  try {
    // First check if the project is opt-in.
    const projectRecord = await db.query.project.findFirst({
      where: (project, { eq }) => eq(project.id, projectID),
    });

    if (projectRecord?.optIn == null) return false;

    const projectVersions: Project = (
      await axios(`https://api.modrinth.com/v2/project/${projectID}`)
    ).data;

    return projectVersions;
  } catch {
    return false;
  }
}

/**
 * Check for any new versions not present in Loqui's database, and extract strings/update existing ones where needed.
 * @param projectID The project in question's ID.
 */
export default async function checkForNewVersions(
  projectID: string,
): Promise<void> {
  const project = await isProjectValid(projectID);

  if (project === false) {
    return;
  }

  // https://docs.modrinth.com/api/operations/getprojectversions/
  const projectVersions: ProjectVersion[] = (
    await axios(`https://api.modrinth.com/v2/project/${projectID}/version`)
  ).data;

  const existingVersions = await db
    .select()
    .from(version)
    .where(eq(version.projectId, projectID));
  const existingVersionIds = new Set(existingVersions.map((v) => v.id));

  const versionsToInsert: { id: string; projectId: string }[] = [];
  const versionItemsMap = new Map<string, { key: string; value: string }[]>();
  const allItemsMap = new Map<string, { key: string; value: string }>();

  const concurrency = 5;
  for (let i = 0; i < projectVersions.length; i += concurrency) {
    const batch = projectVersions.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (projectVersion) => {
        if (!existingVersionIds.has(projectVersion.id)) {
          console.log(
            `[${projectVersion.id}] Found new version: ${projectVersion.id}`,
          );
          versionsToInsert.push({
            id: projectVersion.id,
            projectId: projectID,
          });

          const primaryFile =
            projectVersion.files.find((file) => file.primary) ??
            projectVersion.files[0];
          const strings: TranslationStrings | undefined =
            await downloadJarAndExtractStrings(primaryFile.url);

          if (!strings) {
            return;
          }

          console.log(
            `[${projectVersion.id}] Found ${Object.keys(strings).length} strings.`,
          );

          const itemsForVersion: { key: string; value: string }[] = [];
          for (const [key, value] of Object.entries(strings)) {
            itemsForVersion.push({ key, value });
            const itemKey = `${key}-${value}`;
            allItemsMap.set(itemKey, { key, value });
          }
          versionItemsMap.set(projectVersion.id, itemsForVersion);
        }
      }),
    );
  }

  if (versionsToInsert.length > 0) {
    await db.insert(version).values(versionsToInsert);
    console.log("Inserted versions to DB");
  } else {
    console.log("No new versions to insert.");
  }

  const allItems = Array.from(allItemsMap.values());
  const existingItems = await db
    .select()
    .from(item)
    .where(
      and(
        inArray(
          item.key,
          allItems.map(({ key }) => key),
        ),
        inArray(
          item.value,
          allItems.map(({ value }) => value),
        ),
      ),
    );

  const existingItemsMap = new Map<
    string,
    { id: number; key: string; value: string }
  >();
  for (const existingItem of existingItems) {
    const itemKey = `${existingItem.key}-${existingItem.value}`;
    existingItemsMap.set(itemKey, existingItem);
  }

  const newItemsToInsert = allItems.filter(({ key, value }) => {
    const itemKey = `${key}-${value}`;
    return !existingItemsMap.has(itemKey);
  });

  if (newItemsToInsert.length > 0) {
    const insertedItems = await db
      .insert(item)
      .values(newItemsToInsert)
      .returning();
    for (const insertedItem of insertedItems) {
      const itemKey = `${insertedItem.key}-${insertedItem.value}`;
      existingItemsMap.set(itemKey, insertedItem);
    }
    console.log("Inserted new strings");
  } else {
    console.log("No new strings to insert.");
  }

  const versionToItemInserts: { versionId: string; itemId: number }[] = [];
  for (const [versionId, items] of versionItemsMap.entries()) {
    for (const { key, value } of items) {
      const itemKey = `${key}-${value}`;
      const itemRecord = existingItemsMap.get(itemKey);
      if (itemRecord) {
        versionToItemInserts.push({ versionId, itemId: itemRecord.id });
      }
    }
  }

  if (versionToItemInserts.length > 0) {
    await db.insert(versionToItem).values(versionToItemInserts);
    console.log("Inserted versionToItem records.");
  } else {
    console.log("No new version to item links required to be inserted.");
  }
}
