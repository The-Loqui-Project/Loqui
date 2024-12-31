import APIRoute from "../../../../route";
import db from "../../../../../db";
import { item } from "../../../../../db/schema/schema";
import { eq } from "drizzle-orm";

export default {
  type: "GET",
  route: "/project/:id/string/:string_id",
  schema: {
    description:
      "Get details on a single string in a project including it's current proposals.",
    tags: ["strings"],
    response: {
      200: {
        type: "object",
        properties: {
          id: { type: "number" },
          key: { type: "string" },
          value: { type: "string" },
          appears_in: {
            type: "array",
            items: { type: "string" },
          },
          proposals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                value: { type: "string" },
                note: { type: "string" },
                status: { type: "string" },
                locale: { type: "string" },
                user: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    role: { type: "string" },
                  },
                },
              },
            },
          },
          translations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                languageCode: { type: "string" },
                userId: { type: "string" },
              },
            },
          },
        },
      },
      404: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  func: async (request, response) => {
    const projectId = (request.params as any)?.id;
    const stringId = parseInt((request.params as any)?.string_id, 10);

    if (!projectId || Number.isNaN(stringId)) {
      response.status(404).send({ message: "Invalid parameters." });
      return;
    }

    // Ensure project exists and has opted in
    const projectData = await db.query.project.findFirst({
      where: (proj, { eq }) => eq(proj.id, projectId),
    });
    if (!projectData || !projectData.optIn) {
      response.status(404).send({
        message:
          "No valid project with the specified ID, or project not opted in.",
      });
      return;
    }

    // Fetch versions for the project
    const versionData = await db.query.version.findMany({
      where: (v, { eq }) => eq(v.projectId, projectId),
      with: { versionToItems: true },
    });

    // All item IDs in this project
    const itemIDs = [
      ...new Set(
        versionData.flatMap((v) => v.versionToItems.map((rel) => rel.itemId)),
      ),
    ];
    if (!itemIDs.includes(stringId)) {
      response
        .status(404)
        .send({ message: "String not found in this project." });
      return;
    }

    // Build a version map for items -> version IDs
    const itemVersionMap = new Map<number, string[]>();
    versionData.forEach((v) => {
      v.versionToItems.forEach((rel) => {
        if (!itemVersionMap.has(rel.itemId)) {
          itemVersionMap.set(rel.itemId, []);
        }
        itemVersionMap.get(rel.itemId)!.push(v.id.toString());
      });
    });

    // Fetch the item
    const [foundItem] = await db
      .select()
      .from(item)
      .where(eq(item.id, stringId));
    if (!foundItem) {
      response.status(404).send({ message: "String not found." });
      return;
    }

    // Fetch all translations for this item
    const foundTranslations = await db.query.translation.findMany({
      where: (t, { eq }) => eq(t.itemId, stringId),
    });

    // Map of foundTranslation by its id.
    const translationMap = foundTranslations.reduce(
      (map, t) => map.set(t.id, t),
      new Map<
        number,
        {
          id: number;
          languageCode: string;
          userId?: string | null;
        }
      >(),
    );

    // Fetch all proposals linked to translations of this item
    const translationIds = foundTranslations.map((t) => t.id);
    const foundProposals = await db.query.proposal.findMany({
      where: (p, { inArray }) => inArray(p.translationId, translationIds),
      with: {
        user: true,
      },
    });

    // Format proposals with user info
    const proposalsFormatted = foundProposals.map((p) => ({
      id: p.id,
      value: p.value,
      note: p.note,
      status: p.status,
      locale: translationMap.get(p.translationId)?.languageCode ?? "unknown",
      user: {
        id: p.user?.id,
        role: p.user?.role,
      },
    }));

    response.status(200).send({
      id: foundItem.id,
      key: foundItem.key,
      value: foundItem.value,
      appears_in: itemVersionMap.get(foundItem.id) ?? [],
      proposals: proposalsFormatted,
      translations: foundTranslations.map((t) => ({
        id: t.id,
        languageCode: t.languageCode,
        userId: t.userId ?? null,
      })),
    });
  },
} as APIRoute;
