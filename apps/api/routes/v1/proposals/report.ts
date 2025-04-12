import APIRoute from "../../route";
import db from "../../../db";
import { proposal, proposalReport } from "../../../db/schema/schema";
import { AuthUtils } from "../../../util/auth-utils";
import { and, eq } from "drizzle-orm";

export default {
  type: "POST",
  route: "/proposals/:id/report",
  schema: {
    description: "Report a proposal as inappropriate or incorrect",
    tags: ["proposals"],
    security: [{ modrinthToken: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID of the proposal to report" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Reason for reporting the proposal",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Priority level of the report (default: medium)",
        },
      },
      required: ["reason"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string", description: "Success message" },
          reportId: { type: "number", description: "ID of the created report" },
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

    const { reason, priority = "medium" } = request.body as {
      reason: string;
      priority?: "low" | "medium" | "high" | "critical";
    };

    if (!reason || reason.trim().length === 0) {
      response.status(400).send({
        message: "Reason is required for reporting a proposal",
      });
      return;
    }

    try {
      // Get current proposal
      const proposalData = await db.query.proposal.findFirst({
        where: (p, { eq }) => eq(p.id, proposalId),
        with: {
          translation: {
            with: {
              item: true,
            },
          },
        },
      });

      if (!proposalData) {
        response.status(404).send({
          message: "Proposal not found",
        });
        return;
      }

      // Check if this user has already reported this proposal
      const existingReport = await db.query.proposalReport.findFirst({
        where: (r, { and, eq }) =>
          and(eq(r.proposalId, proposalId), eq(r.reporterId, authUser.id)),
      });

      if (existingReport) {
        response.status(400).send({
          message: "You have already reported this proposal",
        });
        return;
      }

      // Create a report in the database
      const [newReport] = await db
        .insert(proposalReport)
        .values({
          proposalId,
          reporterId: authUser.id,
          reason: reason.trim(),
          priority,
          status: "open",
        })
        .returning({ id: proposalReport.id });

      // Slightly decrease the score of reported proposals
      await db
        .update(proposal)
        .set({
          score: Math.max(0, proposalData.score - 1),
        })
        .where(eq(proposal.id, proposalId));

      // Flag high priority reports of accurate proposals
      if (
        proposalData.status === "accurate" &&
        (priority === "high" || priority === "critical")
      ) {
        // In a real implementation, this could send notifications to moderators
        console.log(
          `ALERT: ${priority} priority report on accurate proposal ${proposalId}`,
        );
      }

      response.status(200).send({
        message:
          "Proposal reported successfully. Our moderators will review it.",
        reportId: newReport.id,
      });
    } catch (error) {
      console.error("Error reporting proposal:", error);
      response.status(400).send({
        message: "Failed to report proposal",
      });
    }
  },
} as APIRoute;
