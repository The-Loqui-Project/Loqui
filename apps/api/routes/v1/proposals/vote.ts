import APIRoute from "../../route";
import db from "../../../db";
import { proposal, proposalVote } from "../../../db/schema/schema";
import { AuthUtils } from "../../../util/auth-utils";
import { and, eq, sql } from "drizzle-orm";
import { updateProposalStatuses } from "../../../util/proposal-utils";

export default {
  type: "POST",
  route: "/proposals/:id/vote",
  schema: {
    description: "Vote on a translation proposal (upvote/downvote)",
    tags: ["proposals"],
    security: [{ modrinthToken: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID of the proposal to vote on" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        voteType: {
          type: "string",
          enum: ["up", "down", "none"],
          description: "Type of vote (up, down, or none to remove vote)",
        },
      },
      required: ["voteType"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string", description: "Success message" },
          newScore: { type: "number", description: "New score after voting" },
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
    // Authenticate user with auto-creation if they don't exist in DB yet
    const authUser = await AuthUtils.authenticateUser(request, response, {
      requireDbUser: true,
      createIfNotExists: true,
    });

    // If auth failed, the function would have already sent a response
    if (!authUser) return;

    // Parse the proposal ID parameter
    const proposalId = AuthUtils.parseIdParam(request, response);
    if (proposalId === undefined) return;

    const { voteType } = request.body as { voteType: "up" | "down" | "none" };

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

      // Don't allow voting on own proposals
      if (proposalData.userId === authUser.id) {
        response.status(403).send({
          message: "Cannot vote on your own proposal",
        });
        return;
      }

      // Check if user has already voted
      const existingVote = await db.query.proposalVote.findFirst({
        where: (v, { and, eq }) =>
          and(eq(v.proposalId, proposalId), eq(v.userId, authUser.id)),
      });

      let scoreChange = 0;

      // Handle the vote
      if (voteType === "none") {
        // Remove the vote if it exists
        if (existingVote) {
          // Reverse the previous vote impact
          scoreChange = -existingVote.isUpvote;

          // Delete the vote record
          await db
            .delete(proposalVote)
            .where(
              and(
                eq(proposalVote.proposalId, proposalId),
                eq(proposalVote.userId, authUser.id),
              ),
            );
        }
      } else {
        // Determine vote value (1 for upvote, -1 for downvote)
        const voteValue = voteType === "up" ? 1 : -1;

        if (existingVote) {
          // Update existing vote and calculate score change
          // If changing from up to down or vice versa, the impact is doubled
          const oldValue = existingVote.isUpvote;
          scoreChange = voteValue - oldValue;

          await db
            .update(proposalVote)
            .set({ isUpvote: voteValue })
            .where(
              and(
                eq(proposalVote.proposalId, proposalId),
                eq(proposalVote.userId, authUser.id),
              ),
            );
        } else {
          // Create new vote
          scoreChange = voteValue;

          await db.insert(proposalVote).values({
            proposalId,
            userId: authUser.id,
            isUpvote: voteValue,
          });
        }
      }

      // Update the proposal score
      const [updatedProposal] = await db
        .update(proposal)
        .set({
          score: sql`${proposal.score} + ${scoreChange}`,
        })
        .where(eq(proposal.id, proposalId))
        .returning({
          newScore: proposal.score,
          translationId: proposal.translationId,
        });

      // Update proposal statuses based on new vote
      await updateProposalStatuses(updatedProposal.translationId);

      response.status(200).send({
        message: `Vote ${voteType} registered successfully`,
        newScore: updatedProposal.newScore,
      });
    } catch (error) {
      console.error("Error voting on proposal:", error);
      response.status(400).send({
        message: "Failed to register vote",
      });
    }
  },
} as APIRoute;
