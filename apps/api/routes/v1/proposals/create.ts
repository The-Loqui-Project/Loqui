import APIRoute from "../../route";
import db from "../../../db";
import { proposal, translation } from "../../../db/schema/schema";
import { AuthUtils } from "../../../util/auth-utils";

export default {
  type: "POST",
  route: "/proposals/create",
  schema: {
    description: "Create a new translation proposal",
    tags: ["proposals"],
    security: [{ modrinthToken: [] }],
    body: {
      type: "object",
      required: ["translationId", "value"],
      properties: {
        translationId: { type: "number", description: "ID of the translation" },
        value: { type: "string", description: "Proposed translation" },
        note: {
          type: "string",
          description: "Optional note about the proposal",
        },
      },
    },
    response: {
      201: {
        type: "object",
        properties: {
          id: { type: "number", description: "ID of the new proposal" },
          message: { type: "string", description: "Success message" },
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
    const { translationId, value, note } = request.body as {
      translationId: number;
      value: string;
      note?: string;
    };

    try {
      // Check if translation exists
      const translationData = await db.query.translation.findFirst({
        where: (t, { eq }) => eq(t.id, translationId),
      });

      if (!translationData) {
        response.status(404).send({
          message: "Translation not found",
        });
        return;
      }

      // Create new proposal
      const [newProposal] = await db
        .insert(proposal)
        .values({
          userId: authUser.id,
          translationId,
          value,
          note,
          status: "pending",
          score: 0,
          approvals: 0,
        })
        .returning({ id: proposal.id });

      response.status(201).send({
        id: newProposal.id,
        message: "Proposal created successfully",
      });
    } catch (error) {
      console.error("Error creating proposal:", error);
      response.status(400).send({
        message: "Failed to create proposal",
      });
    }
  },
} as APIRoute;
