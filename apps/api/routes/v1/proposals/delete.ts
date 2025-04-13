import APIRoute from "../../route";
import db from "../../../db";
import { proposal, proposalVote } from "../../../db/schema/schema";
import { AuthUtils } from "../../../util/auth-utils";
import { and, eq, count } from "drizzle-orm";

export default {
  type: "DELETE",
  route: "/proposals/:id",
  schema: {
    description:
      "Delete a proposal (moderator+ or proposal owner with zero votes)",
    tags: ["proposals"],
    security: [{ modrinthToken: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID of the proposal to delete" },
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

    // Parse the proposal ID parameter
    const proposalId = AuthUtils.parseIdParam(request, response);
    if (proposalId === undefined) return;

    try {
      // Get current proposal
      const proposalData = await db.query.proposal.findFirst({
        where: (p, { eq }) => eq(p.id, proposalId),
      });

      if (!proposalData) {
        response.status(404).send({
          message: "Proposal not found",
        });
        return;
      }

      const isModerator = ["moderator", "admin"].includes(authUser.role);
      const isOwner = proposalData.userId === authUser.id;

      // If user is not a moderator and not the owner, reject the request
      if (!isModerator && !isOwner) {
        response.status(403).send({
          message: "You do not have permission to delete this proposal",
        });
        return;
      }

      // If user is the owner but not a moderator, check if proposal has votes
      if (isOwner && !isModerator) {
        // Count votes for this proposal
        const voteResult = await db
          .select({ voteCount: count() })
          .from(proposalVote)
          .where(eq(proposalVote.proposalId, proposalId));

        const voteCount = voteResult[0]?.voteCount || 0;

        if (voteCount > 0) {
          response.status(403).send({
            message:
              "Cannot delete proposal that has votes. Contact a moderator for assistance.",
          });
          return;
        }
      }

      // Delete the proposal
      await db.delete(proposal).where(eq(proposal.id, proposalId));

      response.status(200).send({
        message: "Proposal deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting proposal:", error);
      response.status(400).send({
        message: "Failed to delete proposal",
      });
    }
  },
} as APIRoute;
