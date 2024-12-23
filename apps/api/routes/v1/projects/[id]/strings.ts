import APIRoute from "../../../route";
import db from "../../../../db";
import { item } from "../../../../db/schema/schema";
import { inArray } from "drizzle-orm";

export default {
  type: "GET",
  route: "/project/:id/strings",
  schema: {
    description: "Get all strings available to translate from a project.",
    response: {
      200: {
        type: "array",
        description: "An array of strings ready to translate.",
        items: {
          type: "object",
          description: "A project's string.",
          properties: {
            id: { type: "number" },
            key: { type: "string" },
            value: { type: "string" },
            appears_in: {
              type: "array",
              description: "An array of version IDs this string appears in.",
              items: { type: "string" },
            },
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

    const versionData = await db.query.version.findMany({
      where: (version, { eq }) => eq(version.projectId, id),
      with: {
        versionToItems: true,
      },
    });

    const itemIDs = [
      ...new Set(
        versionData.flatMap((v) => v.versionToItems.map((i) => i.itemId)),
      ),
    ];

    // Map each item to the version IDs it appears in
    const itemVersionMap = new Map<number, string[]>();
    versionData.forEach((v) => {
      v.versionToItems.forEach((rel) => {
        if (!itemVersionMap.has(rel.itemId)) {
          itemVersionMap.set(rel.itemId, []);
        }
        itemVersionMap.get(rel.itemId)!.push(v.id.toString());
      });
    });

    // Query all items
    const items = await db.select().from(item).where(inArray(item.id, itemIDs));

    // Build the response
    const responseData = items.map((i) => ({
      id: i.id,
      key: i.key,
      value: i.value,
      appears_in: itemVersionMap.get(i.id) ?? [],
    }));

    response.status(200).send(responseData);
  },
} as APIRoute;
