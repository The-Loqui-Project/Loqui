import APIRoute from "../../route";
import db from "../../../db";
import { proposal, translation } from "../../../db/schema/schema";
import { AuthUtils } from "../../../util/auth-utils";
import { updateProposalStatuses } from "../../../util/proposal-utils";

export default {
  type: "POST",
  route: "/translations/:id/proposals",
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

      // Create the proposal
      const [newProposal] = await db
        .insert(proposal)
        .values({
          translationId: translationId,
          userId: authUser.id,
          value: value.trim(),
          note: note?.trim(),
          status: "pending", // Always start as pending, utility function will update if appropriate
        })
        .returning({
          id: proposal.id,
          value: proposal.value,
          note: proposal.note,
          status: proposal.status,
        });

      // Update proposal statuses to ensure proper order and mark the best one as accurate if appropriate
      await updateProposalStatuses(translationId);

      // Return the newly created proposal data
      response.status(201).send({
        message: "Proposal created successfully",
        proposal: newProposal,
      });
    } catch (error) {
      console.error("Error creating proposal:", error);
      response.status(400).send({
        message: "Failed to create proposal",
      });
    }
  },
} as APIRoute;
