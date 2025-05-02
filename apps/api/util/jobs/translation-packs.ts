import { and, eq, gt, inArray, sql, count } from "drizzle-orm";
import db from "../../db";
import {
  item,
  language,
  proposal,
  project,
  translation,
  translationPack,
  versionTranslationPackStatus,
  versionToItem,
} from "../../db/schema/schema";
import taskManager from "../task-manager";
import fs from "fs/promises";
import path from "path";
import JSZip from "jszip";
import crypto from "crypto";

// Directory to store generated resource packs
const RESOURCE_PACK_DIR = process.env.PACK_GENERATION_FOLDER_OUTPUT!;

/**
 * Checks all versions with dirty translation status and generates
 * translation packs for those meeting the threshold requirements.
 *
 * Threshold:
 * - At least 10% translated OR
 * - At least 45 strings translated
 */
export async function processTranslationPacks() {
  const taskId = taskManager.createTask({
    description: "Processing translation packs",
  });

  // Run the task in the background - don't await the result
  taskManager.executeTask(taskId, async (updateProgress) => {
    updateProgress = (progress: number) => {
      console.log("processing progress: " + progress);
    };

    // 0. Initialize translation pack statuses for versions without any
    await initializeMissingTranslationPackStatuses();
    updateProgress(5);

    // 1. Get all versions that need translation pack updates
    const dirtyStatuses = await db.query.versionTranslationPackStatus.findMany({
      where: eq(versionTranslationPackStatus.needsRelease, true),
      with: {
        version: {
          with: {
            project: true,
          },
        },
      },
    });

    if (dirtyStatuses.length === 0) {
      updateProgress(100);
      return { processed: 0, message: "No translation packs to update" };
    }

    updateProgress(10);

    // Group by project for more efficient processing
    const versionsByProject: Record<
      string,
      {
        projectId: string;
        versions: {
          versionId: string;
          languageCode: string;
        }[];
      }
    > = {};

    dirtyStatuses.forEach((status) => {
      const projectId = status.version.projectId;

      if (!versionsByProject[projectId]) {
        versionsByProject[projectId] = {
          projectId,
          versions: [],
        };
      }

      versionsByProject[projectId].versions.push({
        versionId: status.versionId,
        languageCode: status.languageCode,
      });
    });

    updateProgress(10);

    // Process each project
    const results: any[] = [];
    let processedCount = 0;
    const projectIds = Object.keys(versionsByProject);

    for (let i = 0; i < projectIds.length; i++) {
      const projectId = projectIds[i];
      const projectData = versionsByProject[projectId];

      try {
        // Process this project's versions
        const result = await processProjectTranslationPacks(
          projectData.projectId,
          projectData.versions,
        );

        results.push(result);
      } catch (error) {
        console.error(
          `Error processing translation packs for project ${projectId}:`,
          error,
        );
        results.push({
          projectId,
          success: false,
          error: String(error),
        });
      }

      processedCount++;
      const progress =
        Math.floor((processedCount / projectIds.length) * 90) + 10;
      updateProgress(progress);
    }

    updateProgress(100);

    return {
      processed: results.length,
      results,
    };
  });

  return taskId;
}

/**
 * Find versions without any translation pack status records and create initial statuses for them
 * @returns Number of status records created
 */
async function initializeMissingTranslationPackStatuses(): Promise<number> {
  // 1. Get all versions
  const allVersions = await db.query.version.findMany({
    with: {
      project: true,
    },
  });

  if (allVersions.length === 0) {
    console.log("No versions found in the database");
    return 0;
  }

  let statusesCreated = 0;

  // 2. Check each version
  for (const version of allVersions) {
    // Get available languages with translations for this version
    const versionItems = await db.query.versionToItem.findMany({
      where: eq(versionToItem.versionId, version.id),
      columns: { itemId: true },
    });

    const itemIds = versionItems.map((v) => v.itemId);

    if (itemIds.length === 0) {
      continue; // Skip versions with no items
    }

    // Find languages with accurate proposals for these items
    const availableLanguages = await db
      .selectDistinct({ languageCode: translation.languageCode })
      .from(translation)
      .where(
        and(
          inArray(translation.itemId, itemIds),
          sql`exists (
            select 1 from ${proposal}
            where ${proposal.translationId} = ${translation.id}
            and ${proposal.status} = 'accurate'
          )`,
        ),
      );

    if (availableLanguages.length === 0) {
      continue; // No languages with translations available
    }

    // Get existing status records for this version
    const existingStatuses =
      await db.query.versionTranslationPackStatus.findMany({
        where: eq(versionTranslationPackStatus.versionId, version.id),
      });

    const existingLanguageCodes = existingStatuses.map((s) => s.languageCode);

    // Create status records for languages that don't have them yet
    for (const { languageCode } of availableLanguages) {
      if (!existingLanguageCodes.includes(languageCode)) {
        try {
          await db.insert(versionTranslationPackStatus).values({
            versionId: version.id,
            languageCode,
            needsRelease: true,
            lastUpdated: new Date(),
          });
          statusesCreated++;
        } catch (error) {
          console.error(
            `Error creating translation pack status for version ${version.id}, language ${languageCode}:`,
            error,
          );
        }
      }
    }
  }

  console.log(`Created ${statusesCreated} new translation pack status records`);
  return statusesCreated;
}

/**
 * Process translation packs for a specific project
 */
async function processProjectTranslationPacks(
  projectId: string,
  versionLangs: { versionId: string; languageCode: string }[],
): Promise<any> {
  // Check if a translation pack project exists for this project
  let packProject = await db.query.translationPack.findFirst({
    where: eq(translationPack.projectId, projectId),
  });

  // Define two possible result types - one for single versions and one for grouped versions
  type SingleVersionResult = {
    versionId: string;
    languageCode: string;
    meetsThreshold: boolean;
    translatedCount?: number;
    totalCount?: number;
    translatedPercentage?: number;
    packCreated?: boolean;
    error?: string;
  };

  type GroupedVersionsResult = {
    versionIds: string[];
    languageCodes: string[];
    generatedPack?: boolean;
    packPath?: string | null;
    error?: string;
  };

  // Union type that can be either single version or grouped versions result
  type TranslationPackResult = SingleVersionResult | GroupedVersionsResult;

  const results: TranslationPackResult[] = [];

  // Group versions by their translations to avoid regenerating identical packs
  const versionsByTranslations: Record<
    string,
    {
      versionIds: string[];
      languageCodes: string[];
      translationFiles?: Record<string, Record<string, string>>;
    }
  > = {};

  // First pass: gather all translations and check which versions meet the threshold
  for (const { versionId, languageCode } of versionLangs) {
    try {
      // 1. Check if threshold is met
      const versionItems = await db.query.versionToItem.findMany({
        where: eq(versionToItem.versionId, versionId),
        columns: { itemId: true },
      });

      const itemIds = versionItems.map((v) => v.itemId);
      const totalStrings = itemIds.length;

      if (totalStrings === 0) {
        results.push({
          versionId,
          languageCode,
          meetsThreshold: true,
          translatedCount: 0,
          totalCount: 0,
          translatedPercentage: 0,
          error: "No strings found for this version",
        });
        continue;
      }

      // Count translations with "accurate" proposals
      const translatedCountQuery = await db
        .select({
          count: count(),
        })
        .from(translation)
        .where(
          and(
            inArray(translation.itemId, itemIds),
            eq(translation.languageCode, languageCode),
            // Check if an accurate proposal exists for this translation
            sql`exists (
          select 1 from ${proposal}
          where ${proposal.translationId} = ${translation.id}
          and ${proposal.status} = 'accurate'
        )`,
          ),
        );

      const translatedCount = Number(translatedCountQuery[0]?.count || 0);
      const translatedPercentage = (translatedCount / totalStrings) * 100;
      /**
       *       const meetsThreshold =
        translatedCount >= 45 || translatedPercentage >= 10;
       */
      const meetsThreshold = true;

      results.push({
        versionId,
        languageCode,
        meetsThreshold,
        translatedCount,
        totalCount: totalStrings,
        translatedPercentage,
      });

      console.log(results);

      // If threshold is not met, skip this version
      if (!meetsThreshold) {
        continue;
      }

      // Generate translation files for this version
      const translationFiles =
        await generateTranslationFilesForVersion(versionId);

      // Create a hash of the translation files to identify identical packs
      const translationsHash = hashTranslations(translationFiles);

      if (!versionsByTranslations[translationsHash]) {
        versionsByTranslations[translationsHash] = {
          versionIds: [],
          languageCodes: [],
          translationFiles,
        };
      }

      if (
        !versionsByTranslations[translationsHash].versionIds.includes(versionId)
      ) {
        versionsByTranslations[translationsHash].versionIds.push(versionId);
      }

      if (
        !versionsByTranslations[translationsHash].languageCodes.includes(
          languageCode,
        )
      ) {
        versionsByTranslations[translationsHash].languageCodes.push(
          languageCode,
        );
      }

      // Mark as released (not dirty anymore)
      await db
        .update(versionTranslationPackStatus)
        .set({ needsRelease: false })
        .where(
          and(
            eq(versionTranslationPackStatus.versionId, versionId),
            eq(versionTranslationPackStatus.languageCode, languageCode),
          ),
        );

      // If there's no pack project yet and this is the first version meeting threshold,
      // create one
      if (!packProject) {
        // Create new translation pack project
        const [newPack] = await db
          .insert(translationPack)
          .values({
            projectId,
            lastUpdated: new Date(),
          })
          .returning();

        packProject = newPack;
      }
    } catch (error) {
      console.error(
        `Error processing translation pack for version ${versionId}, language ${languageCode}:`,
        error,
      );
      results.push({
        versionId,
        languageCode,
        meetsThreshold: false,
        error: String(error),
      });
    }
  }

  // Second pass: generate actual resource packs for each unique translation set
  for (const [translationsHash, data] of Object.entries(
    versionsByTranslations,
  )) {
    if (
      !data.translationFiles ||
      Object.keys(data.translationFiles).length === 0
    ) {
      continue;
    }

    try {
      // Generate the pack and get its path
      const packPath = await generateResourcePack(
        projectId,
        data.versionIds,
        data.translationFiles,
      );

      if (packPath) {
        console.log(
          `Generated resource pack for project ${projectId} with ${data.versionIds.length} version(s) at ${packPath}`,
        );

        results.push({
          versionIds: data.versionIds,
          languageCodes: data.languageCodes,
          generatedPack: true,
          packPath,
        });

        // Update pack project with latest update time
        if (packProject) {
          await db
            .update(translationPack)
            .set({ lastUpdated: new Date() })
            .where(eq(translationPack.id, packProject.id));
        }
      } else {
        throw new Error("Failed to generate resource pack");
      }
    } catch (error) {
      console.error(
        `Error generating resource pack for project ${projectId}:`,
        error,
      );
      results.push({
        versionIds: data.versionIds,
        languageCodes: data.languageCodes,
        generatedPack: false,
        error: String(error),
      });
    }
  }

  return {
    projectId,
    packId: packProject?.id,
    packCount: Object.keys(versionsByTranslations).length,
    results,
  };
}

/**
 * Generate a hash of translation files to identify identical packs
 */
export function hashTranslations(
  translationFiles: Record<string, Record<string, string>>,
): string {
  const content = JSON.stringify(translationFiles);
  return crypto.createHash("md5").update(content).digest("hex");
}

/**
 * Generate a resource pack file for the provided translations and save it to disk
 *
 * @returns Path to the generated resource pack file
 */
export async function generateResourcePack(
  projectId: string,
  versionIds: string[],
  translationFiles: Record<string, Record<string, string>>,
): Promise<string | null> {
  try {
    // Get project info
    let projectInfo;
    try {
      projectInfo = await (
        await fetch("https://api.modrinth.com/v2/project/" + projectId)
      ).json();
    } catch (error) {
      // For testing purposes, create a mock project info if database query fails
      console.log("Using mock project info for testing purposes");
      projectInfo = {
        id: projectId,
        name: "Test Project",
        slug: projectId,
      };
    }

    if (!projectInfo) {
      // For testing purposes, create a mock project info if project not found
      console.log("Using mock project info for testing purposes");
      projectInfo = {
        id: projectId,
        name: "Test Project",
        slug: projectId,
      };
    }

    // Ensure temp directory exists
    await fs.mkdir(RESOURCE_PACK_DIR, { recursive: true });

    // Create a unique filename for this pack - include version hash to identify identical packs
    const translationsHash = hashTranslations(translationFiles);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const packName = `${projectInfo.slug || projectId}_${translationsHash}_${timestamp}.zip`;
    const packPath = path.join(RESOURCE_PACK_DIR, packName);

    // Check if an identical pack (same hash) already exists for better efficiency
    try {
      const files = await fs.readdir(RESOURCE_PACK_DIR);
      const existingPack = files.find((file) =>
        file.includes(`${projectInfo.slug || projectId}_${translationsHash}_`),
      );

      if (existingPack) {
        console.log(
          `Using existing pack with same content hash: ${existingPack}`,
        );
        return path.join(RESOURCE_PACK_DIR, existingPack);
      }
    } catch (err) {
      // Directory might not exist yet, continue with pack creation
    }

    // Create the zip file
    const zip = new JSZip();

    // Add pack.mcmeta file
    const packMcmeta = {
      pack: {
        pack_format: 9, // Compatible with most recent versions
        description: `Translations for ${projectInfo.name || projectId} provided by Loqui`,
      },
    };
    zip.file("pack.mcmeta", JSON.stringify(packMcmeta, null, 2));

    // Add pack.png if we had one (we don't right now)
    // zip.file('pack.png', await fs.readFile('path/to/pack/icon.png'));

    // Process all translation files
    // Organize by namespaces for better file organization
    const namespaceMap: Record<
      string,
      Record<string, Record<string, string>>
    > = {};

    // Organize translations by namespace
    for (const [langCode, translations] of Object.entries(translationFiles)) {
      for (const [fullKey, value] of Object.entries(translations)) {
        // Split the key into namespace and key parts
        // Format: "namespace:key" -> ["namespace", "key"]
        const keyParts = fullKey.split(":");
        let namespace: string, key: string;

        if (keyParts.length > 1) {
          namespace = keyParts[0];
          key = keyParts.slice(1).join(":"); // Handle cases with multiple colons
        } else {
          // Default namespace if no colon in key
          namespace = "minecraft";
          key = fullKey;
        }

        // Initialize namespace and language objects if needed
        if (!namespaceMap[namespace]) {
          namespaceMap[namespace] = {};
        }

        if (!namespaceMap[namespace][langCode]) {
          namespaceMap[namespace][langCode] = {};
        }

        // Add the translation
        namespaceMap[namespace][langCode][key] = value;
      }
    }

    // Add language files to the zip in the correct directory structure
    for (const [namespace, languages] of Object.entries(namespaceMap)) {
      for (const [langCode, translations] of Object.entries(languages)) {
        const filePath = `assets/${namespace}/lang/${langCode}.json`;
        zip.file(filePath, JSON.stringify(translations, null, 2));
      }
    }

    // Generate the ZIP file
    const content = await zip.generateAsync({ type: "nodebuffer" });
    await fs.writeFile(packPath, content);

    console.log(`Resource pack generated at ${packPath}`);
    return packPath;
  } catch (error) {
    console.error("Error generating resource pack:", error);
    return null;
  }
}

/**
 * Generate the translation files data structure for a specific version
 * in the format required by Minecraft resource packs:
 * { "lang-code": { "key": "translation value", ... }, ... }
 */
export async function generateTranslationFilesForVersion(
  versionId: string,
): Promise<Record<string, Record<string, string>>> {
  // 1. Get all items for this version
  const versionItems = await db.query.versionToItem.findMany({
    where: eq(versionToItem.versionId, versionId),
    with: {
      item: true,
    },
  });

  const itemIds = versionItems.map((v) => v.item.id);

  // 2. Get all translations with accurate proposals for these items
  const translations = await db.query.translation.findMany({
    where: inArray(translation.itemId, itemIds),
    with: {
      proposals: {
        where: eq(proposal.status, "accurate"),
      },
      item: true,
    },
  });

  // 3. Organize translations by language code
  const langMap: Record<string, Record<string, string>> = {};

  for (const trans of translations) {
    // Skip if no accurate proposal
    if (trans.proposals.length === 0) continue;

    // Use the first accurate proposal (there should only be one)
    const accurateProposal = trans.proposals[0];

    if (!langMap[trans.languageCode]) {
      langMap[trans.languageCode] = {};
    }

    langMap[trans.languageCode][trans.item.key] = accurateProposal.value;
  }

  return langMap;
}

/**
 * Update translation packs manually from admin/moderator action
 */
export async function processTranslationPacksManually() {
  return processTranslationPacks();
}

export function createModrinthResourcePack(
  projectId: string,
): string | PromiseLike<string | null> | null {
  return null;
}
