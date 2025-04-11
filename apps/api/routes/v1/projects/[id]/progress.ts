// filepath: /workspaces/Loqui/apps/api/routes/v1/projects/[id]/progress.ts
import APIRoute from "../../../route";
import db from "../../../../db";
import {
  item,
  language,
  translation,
  proposal,
  proposalStatusEnum,
} from "../../../../db/schema/schema";
import { and, count, eq, inArray, sql } from "drizzle-orm";

export default {
  type: "GET",
  route: "/project/:id/progress",
  schema: {
    description: "Get translation progress for all languages for a project",
    response: {
      200: {
        type: "object",
        description:
          "An object mapping language codes to their translation progress",
        additionalProperties: {
          type: "object",
          properties: {
            total: { type: "number" },
            translated: { type: "number" },
            progress: { type: "number" },
          },
        },
      },
      404: {
        type: "object",
        description: "The project was not found.",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  func: async (request, response) => {
    const id = (request.params as any).id;

    if (!id) {
      response.status(404).send({
        message: "You didn't specify a project ID!",
      });
      return;
    }

    const projectData = await db.query.project.findFirst({
      where: (project, { eq }) => eq(project.id, id),
    });

    if (!projectData || projectData?.optIn === null) {
      response.status(404).send({
        message: "No valid project exists with the specified project ID.",
      });
      return;
    }

    // Get all versions for this project
    const versionData = await db.query.version.findMany({
      where: (version, { eq }) => eq(version.projectId, id),
      with: {
        versionToItems: true,
      },
    });

    // Get all item IDs associated with this project
    const itemIDs = [
      ...new Set(
        versionData.flatMap((v) => v.versionToItems.map((i) => i.itemId)),
      ),
    ];

    // Get all languages
    const languages = await db.select().from(language);

    // Initialize totalItems count
    let totalItems = itemIDs.length;

    // If no items found, set total to 0 but still return all languages
    if (totalItems === 0) {
      totalItems = 0;
    }

    // For each language, initialize progress object
    const progress: Record<
      string,
      { total: number; translated: number; progress: number }
    > = {};

    // Initialize progress object with all languages
    languages.forEach((lang) => {
      progress[lang.code] = {
        total: totalItems,
        translated: 0,
        progress: 0,
      };
    });

    // If there are no items, return the initialized progress object with all zeroes
    if (totalItems === 0 || itemIDs.length === 0) {
      response.status(200).send(progress);
      return;
    }

    // Get translations with accurate proposals for this project's items
    const translationStats = await db
      .select({
        languageCode: translation.languageCode,
        translatedCount: count(),
      })
      .from(translation)
      .where(inArray(translation.itemId, itemIDs))
      .innerJoin(
        proposal,
        and(
          eq(proposal.translationId, translation.id),
          eq(proposal.status, "accurate"),
        ),
      )
      .groupBy(translation.languageCode);

    // Update progress object with actual translation counts
    translationStats.forEach((stat) => {
      if (progress[stat.languageCode]) {
        progress[stat.languageCode].translated = Number(stat.translatedCount);
        progress[stat.languageCode].progress =
          Number(stat.translatedCount) / totalItems;
      }
    });

    response.status(200).send(progress);
  },
} as APIRoute;
