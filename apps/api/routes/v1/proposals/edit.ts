import APIRoute from "../../route";
import db from "../../../db";
import { proposal, proposalVote } from "../../../db/schema/schema";
import { AuthUtils } from "../../../util/auth-utils";
import { eq, count } from "drizzle-orm";

export default {
  type: "PUT",
  route: "/proposals/:id/edit",
  schema: {
    description:
      "Edit an existing translation proposal (moderator+ or proposal owner with zero votes)",
    tags: ["proposals"],
    security: [{ modrinthToken: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID of the proposal to edit" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      required: ["value"],
      properties: {
        value: { type: "string", description: "Updated translation value" },
        note: {
          type: "string",
          description: "Optional note about the proposal",
        },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string", description: "Success message" },
          proposal: {
            type: "object",
            properties: {
              id: { type: "number" },
              value: { type: "string" },
              note: { type: "string" },
            },
          },
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

    // Get data from request body
    const { value, note } = request.body as {
      value: string;
      note?: string;
    };

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

      // Check if user is authorized to edit this proposal
      const isModerator = ["moderator", "admin"].includes(authUser.role);
      const isOwner = proposalData.userId === authUser.id;

      // If user is not a moderator and not the owner, reject the request
      if (!isOwner && !isModerator) {
        response.status(403).send({
          message: "You do not have permission to edit this proposal",
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
              "Cannot edit proposal that has votes. Create a new proposal instead or contact a moderator.",
          });
          return;
        }
      }

      // Update the proposal
      const [updatedProposal] = await db
        .update(proposal)
        .set({
          value,
          note,
          // If a moderator is editing someone else's proposal, keep status
          // Otherwise reset to pending for the owner
          status: !isOwner && isModerator ? proposalData.status : "pending",
        })
        .where(eq(proposal.id, proposalId))
        .returning({
          id: proposal.id,
          value: proposal.value,
          note: proposal.note,
        });

      response.status(200).send({
        message: "Proposal updated successfully",
        proposal: updatedProposal,
      });
    } catch (error) {
      console.error("Error updating proposal:", error);
      response.status(400).send({
        message: "Failed to update proposal",
      });
    }
  },
} as APIRoute;
