import axios from "axios";
import { Project, ProjectVersion } from "typerinth";
import db from "../db";
import { eq, inArray, and } from "drizzle-orm";
import { item, version, versionToItem } from "../db/schema/schema";
import downloadJarAndExtractStrings, { TranslationStrings } from "./files";
import taskManager from "./task-manager";

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
 * @returns Task ID that can be used to track progress
 */
export default async function checkForNewVersions(
  projectID: string,
): Promise<string> {
  const taskId = taskManager.createTask({
    description: `Checking for new versions of project ${projectID}`,
  });

  // Run the task in the background - don't await it
  taskManager
    .executeTask(taskId, async (updateProgress) => {
      updateProgress(0);

      const project = await isProjectValid(projectID);
      if (project === false) {
        return { status: "project-invalid" };
      }

      updateProgress(10);

      // https://docs.modrinth.com/api/operations/getprojectversions/
      const projectVersions: ProjectVersion[] = (
        await axios(`https://api.modrinth.com/v2/project/${projectID}/version`)
      ).data;

      updateProgress(20);

      const existingVersions = await db
        .select()
        .from(version)
        .where(eq(version.projectId, projectID));
      const existingVersionIds = new Set(existingVersions.map((v) => v.id));

      const versionsToInsert: { id: string; projectId: string }[] = [];
      const versionItemsMap = new Map<
        string,
        { key: string; value: string }[]
      >();
      const allItemsMap = new Map<string, { key: string; value: string }>();

      updateProgress(30);

      // Use the executeBatch function to process versions in smaller chunks
      // and automatically track progress
      const newVersionsCount = projectVersions.filter(
        (v) => !existingVersionIds.has(v.id),
      ).length;

      if (newVersionsCount === 0) {
        updateProgress(100);
        return { status: "no-new-versions" };
      }

      let processedCount = 0;
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

            processedCount++;
            // Calculate progress: 30% for initial setup, 40% for processing versions (30% to 70%)
            const versionProgress =
              (processedCount / projectVersions.length) * 40;
            updateProgress(30 + versionProgress);
          }),
        );
      }

      updateProgress(70);

      if (versionsToInsert.length > 0) {
        await db.insert(version).values(versionsToInsert);
        console.log("Inserted versions to DB");
      } else {
        console.log("No new versions to insert.");
      }

      updateProgress(75);

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

      updateProgress(80);

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

      updateProgress(90);

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

      updateProgress(100);

      return {
        status: "success",
        versionsAdded: versionsToInsert.length,
        stringsAdded: newItemsToInsert.length,
        versionToItemLinksAdded: versionToItemInserts.length,
      };
    })
    .catch((error) => {
      console.error(`Error processing project ${projectID}:`, error);
      return { status: "error", error: error.message };
    });

  return taskId;
}
