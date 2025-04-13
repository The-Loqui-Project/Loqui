import APIRoute from "../../route";
import db from "../../../db";
import { proposal } from "../../../db/schema/schema";
import { AuthUtils } from "../../../util/auth-utils";
import { eq } from "drizzle-orm";
import { updateProposalStatuses } from "../../../util/proposal-utils";

export default {
  type: "POST",
  route: "/proposals/:id/approve",
  schema: {
    description: "Approve a translation proposal (for approved+ roles)",
    tags: ["proposals"],
    security: [{ modrinthToken: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID of the proposal to approve" },
      },
      required: ["id"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string", description: "Success message" },
          approvals: { type: "number", description: "New approval count" },
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

    // Check if user has appropriate permissions (approved+ role required)
    if (!(await AuthUtils.checkPermission(authUser, response, "approved"))) {
      return;
    }

    // Parse the proposal ID parameter
    const proposalId = AuthUtils.parseIdParam(request, response);
    if (proposalId === undefined) return;

    try {
      // Get current proposal
      const proposalData = await db.query.proposal.findFirst({
        where: (p, { eq }) => eq(p.id, proposalId),
        with: {
          translation: true,
        },
      });

      if (!proposalData) {
        response.status(404).send({
          message: "Proposal not found",
        });
        return;
      }

      // Update the proposal approvals
      const [updatedProposal] = await db
        .update(proposal)
        .set({
          approvals: proposalData.approvals + 1,
        })
        .where(eq(proposal.id, proposalId))
        .returning({ approvals: proposal.approvals });

      // Update proposal statuses based on new approval
      await updateProposalStatuses(proposalData.translationId);

      response.status(200).send({
        message: "Proposal approved successfully",
        approvals: updatedProposal.approvals,
      });
    } catch (error) {
      console.error("Error approving proposal:", error);
      response.status(400).send({
        message: "Failed to approve proposal",
      });
    }
  },
} as APIRoute;
