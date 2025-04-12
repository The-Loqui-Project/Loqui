import APIRoute from "../../route";
import db from "../../../db";
import { translation } from "../../../db/schema/schema";
import { AuthUtils } from "../../../util/auth-utils";

export default {
  type: "POST",
  route: "/translations/create",
  schema: {
    description: "Create a new translation record for a language",
    tags: ["translations"],
    security: [{ modrinthToken: [] }],
    body: {
      type: "object",
      required: ["itemId", "languageCode"],
      properties: {
        itemId: { type: "string", description: "ID of the string item" },
        languageCode: { type: "string", description: "Language code" },
      },
    },
    response: {
      201: {
        type: "object",
        properties: {
          id: { type: "number", description: "ID of the new translation" },
        },
      },
      400: {
        type: "object",
        properties: {
          message: { type: "string", description: "Error message" },
        },
      },
      401: {
        type: "object",
        properties: {
          message: { type: "string", description: "Unauthorized message" },
        },
      },
      404: {
        type: "object",
        properties: {
          message: { type: "string", description: "Not found message" },
        },
      },
    },
  },
  func: async (request, response) => {
    // Authenticate user with auto-creation if they don't exist in DB yet
    const authUser = await AuthUtils.authenticateUser(request, response, {
      requireDbUser: true,
      createIfNotExists: true,
    });

    // If auth failed, the function would have already sent a response
    if (!authUser) return;

    // Get data from request body
    const { itemId, languageCode } = request.body as {
      itemId: string;
      languageCode: string;
    };

    try {
      // Check if translation already exists - avoid duplicates
      const existingTranslation = await db.query.translation.findFirst({
        where: (t, { and, eq }) =>
          and(eq(t.itemId, parseInt(itemId)), eq(t.languageCode, languageCode)),
      });

      if (existingTranslation) {
        // If it already exists, just return that ID
        response.status(200).send({
          id: existingTranslation.id,
        });
        return;
      }

      // Create new translation record
      const [newTranslation] = await db
        .insert(translation)
        .values({
          itemId: parseInt(itemId),
          languageCode,
          userId: authUser.id,
        })
        .returning({ id: translation.id });

      response.status(201).send({
        id: newTranslation.id,
      });
    } catch (error) {
      console.error("Error creating translation:", error);
      response.status(400).send({
        message: "Failed to create translation",
      });
    }
  },
} as APIRoute;
