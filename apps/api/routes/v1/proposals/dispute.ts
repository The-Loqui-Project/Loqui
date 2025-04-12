import APIRoute from "../../route";
import db from "../../../db";
import { proposal } from "../../../db/schema/schema";
import { AuthUtils } from "../../../util/auth-utils";
import { eq } from "drizzle-orm";

export default {
  type: "POST",
  route: "/proposals/:id/dispute",
  schema: {
    description: "Dispute an approved translation (can be done by any role)",
    tags: ["proposals"],
    security: [{ modrinthToken: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID of the proposal to dispute" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Reason for disputing the proposal",
        },
      },
      required: ["reason"],
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

    const { reason } = request.body as { reason: string };

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

      // Check if the proposal is already accurate
      if (proposalData.status !== "accurate") {
        response.status(400).send({
          message: "Only accurate proposals can be disputed",
        });
        return;
      }

      // Update the proposal to pending status since it's being disputed
      await db
        .update(proposal)
        .set({
          status: "pending",
          // We could also store the dispute reason in a real implementation
          // For now, we'll just decrement the approval count
          approvals: Math.max(0, proposalData.approvals - 1),
        })
        .where(eq(proposal.id, proposalId));

      // For moderator and admin users, log the dispute action
      if (AuthUtils.hasRole(authUser.role, "moderator")) {
        console.log(
          `Moderator/Admin ${authUser.id} disputed proposal ${proposalId} with reason: ${reason}`,
        );
        // In a real implementation, this would be stored in a disputes/audit log table
      }

      response.status(200).send({
        message: "Proposal disputed successfully",
      });
    } catch (error) {
      console.error("Error disputing proposal:", error);
      response.status(400).send({
        message: "Failed to dispute proposal",
      });
    }
  },
} as APIRoute;
