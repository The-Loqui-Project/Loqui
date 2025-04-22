import APIRoute from "../../route";
import db from "../../../db";
import { proposal, proposalVote } from "../../../db/schema/schema";
import { AuthUtils } from "../../../util/auth-utils";
import { eq } from "drizzle-orm";

export default {
  type: "POST",
  route: "/proposals/:id/reset-votes",
  schema: {
    description: "Reset all votes on a proposal (moderator+ only)",
    tags: ["proposals", "moderation"],
    security: [{ modrinthToken: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID of the proposal" },
      },
      required: ["id"],
    },
    response: {
      200: {
        type: "object",
        properties: {
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
      403: {
        type: "object",
        properties: {
          message: { type: "string", description: "Forbidden message" },
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
    // Authenticate user and check if they exist in the database
    const authUser = await AuthUtils.authenticateUser(request, response, {
      requireDbUser: true,
    });

    // If auth failed, the function would have already sent a response
    if (!authUser) return;

    // Check if user has appropriate permissions (moderator+ role required)
    if (!(await AuthUtils.checkPermission(authUser, response, "moderator"))) {
      return;
    }

    // Parse the proposal ID parameter
    const proposalId = AuthUtils.parseIdParam(request, response);
    if (proposalId === undefined) return;

    try {
      // Check if the proposal exists
      const proposalData = await db.query.proposal.findFirst({
        where: (p, { eq }) => eq(p.id, proposalId),
      });

      if (!proposalData) {
        response.status(404).send({
          message: "Proposal not found",
        });
        return;
      }

      // Delete all votes for this proposal
      await db
        .delete(proposalVote)
        .where(eq(proposalVote.proposalId, proposalId));

      // Reset proposal score to 0
      await db
        .update(proposal)
        .set({
          score: 0,
        })
        .where(eq(proposal.id, proposalId));

      response.status(200).send({
        message: "Proposal votes have been reset successfully",
      });
    } catch (error) {
      console.error("Error resetting proposal votes:", error);
      response.status(400).send({
        message: "Failed to reset proposal votes",
      });
    }
  },
} as APIRoute;
