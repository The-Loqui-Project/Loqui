import APIRoute from "../../../route";
import db from "../../../../db";
import {
  project,
  item,
  language,
  translation,
  proposal,
  user,
  version,
  approvedUserLanguages,
} from "../../../../db/schema/schema";
import { eq, isNotNull, and, sql } from "drizzle-orm";

export default {
  type: "GET",
  route: "/projects/:id/statistics",
  schema: {
    description: "Get statistics for a specific project.",
    tags: ["projects"],
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          numberOfStrings: { type: "number" },
          percentageTranslated: {
            type: "object",
            additionalProperties: { type: "number" },
          },
          numberOfContributors: { type: "number" },
          numberOfApprovedTranslations: { type: "number" },
          numberOfPendingProposals: { type: "number" },
          numberOfInaccurateOrRemovedProposals: { type: "number" },
          numberOfUniqueVersions: { type: "number" },
          numberOfItemsPerVersion: {
            type: "object",
            additionalProperties: { type: "number" },
          },
          numberOfLanguages: { type: "number" },
          numberOfApprovedUserLanguages: { type: "number" },
          numberOfBannedUsers: { type: "number" },
        },
      },
      400: {
        description: "Request failed.",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  func: async (request, response) => {
    const projectId = request.params.id;

    try {
      const numberOfStrings = await db
        .select({ count: sql`COUNT(*)` })
        .from(item)
        .where(
          and(
            isNotNull(item.id),
            eq(item.projectId, projectId)
          )
        );

      const percentageTranslated = await db
        .select({
          languageCode: translation.languageCode,
          percentage: sql`(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ${item} WHERE ${item.projectId} = ${projectId}))`,
        })
        .from(translation)
        .where(eq(translation.projectId, projectId))
        .groupBy(translation.languageCode);

      const numberOfContributors = await db
        .select({ count: sql`COUNT(DISTINCT ${translation.userId})` })
        .from(translation)
        .where(eq(translation.projectId, projectId));

      const numberOfApprovedTranslations = await db
        .select({ count: sql`COUNT(*)` })
        .from(translation)
        .where(
          and(
            eq(translation.projectId, projectId),
            eq(translation.status, "approved")
          )
        );

      const numberOfPendingProposals = await db
        .select({ count: sql`COUNT(*)` })
        .from(proposal)
        .where(
          and(
            eq(proposal.projectId, projectId),
            eq(proposal.status, "pending")
          )
        );

      const numberOfInaccurateOrRemovedProposals = await db
        .select({ count: sql`COUNT(*)` })
        .from(proposal)
        .where(
          and(
            eq(proposal.projectId, projectId),
            or(eq(proposal.status, "inaccurate"), eq(proposal.status, "removed"))
          )
        );

      const numberOfUniqueVersions = await db
        .select({ count: sql`COUNT(DISTINCT ${version.id})` })
        .from(version)
        .where(eq(version.projectId, projectId));

      const numberOfItemsPerVersion = await db
        .select({
          versionId: version.id,
          count: sql`COUNT(${item.id})`,
        })
        .from(version)
        .leftJoin(item, eq(version.projectId, item.projectId))
        .where(eq(version.projectId, projectId))
        .groupBy(version.id);

      const numberOfLanguages = await db
        .select({ count: sql`COUNT(DISTINCT ${language.code})` })
        .from(language)
        .where(eq(language.projectId, projectId));

      const numberOfApprovedUserLanguages = await db
        .select({ count: sql`COUNT(DISTINCT ${approvedUserLanguages.languageCode})` })
        .from(approvedUserLanguages)
        .where(eq(approvedUserLanguages.projectId, projectId));

      const numberOfBannedUsers = await db
        .select({ count: sql`COUNT(*)` })
        .from(user)
        .where(
          and(
            eq(user.projectId, projectId),
            isNotNull(user.banned)
          )
        );

      response.send({
        numberOfStrings: numberOfStrings[0].count,
        percentageTranslated: Object.fromEntries(
          percentageTranslated.map((row) => [row.languageCode, row.percentage])
        ),
        numberOfContributors: numberOfContributors[0].count,
        numberOfApprovedTranslations: numberOfApprovedTranslations[0].count,
        numberOfPendingProposals: numberOfPendingProposals[0].count,
        numberOfInaccurateOrRemovedProposals: numberOfInaccurateOrRemovedProposals[0].count,
        numberOfUniqueVersions: numberOfUniqueVersions[0].count,
        numberOfItemsPerVersion: Object.fromEntries(
          numberOfItemsPerVersion.map((row) => [row.versionId, row.count])
        ),
        numberOfLanguages: numberOfLanguages[0].count,
        numberOfApprovedUserLanguages: numberOfApprovedUserLanguages[0].count,
        numberOfBannedUsers: numberOfBannedUsers[0].count,
      });
    } catch (error) {
      request.log.error(error);
      response.status(400).send({
        message: "Failed to fetch project statistics.",
      });
    }
  },
} as APIRoute;
