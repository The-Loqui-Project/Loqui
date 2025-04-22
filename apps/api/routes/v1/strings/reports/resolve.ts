import APIRoute from "../../../route";
import db from "../../../../db";
import { stringReports } from "../../../../db/schema/schema";
import { AuthUtils } from "../../../../util/auth-utils";
import { eq } from "drizzle-orm";

export default {
  type: "POST",
  route: "/strings/reports/:id/resolve",
  schema: {
    description: "Resolve a string report (for moderator+ roles)",
    tags: ["strings", "reports", "moderation"],
    security: [{ modrinthToken: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID of the report to resolve" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["resolved", "invalid", "investigating"],
          description: "Status to set the report to (default: resolved)",
        },
        note: {
          type: "string",
          description: "Optional resolution note",
        },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string", description: "Success message" },
          report: {
            type: "object",
            properties: {
              id: { type: "number" },
              status: { type: "string" },
              resolvedAt: { type: "string", format: "date-time" },
              resolvedById: { type: "string" },
              resolutionNote: { type: "string" },
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

    // Check if user has appropriate permissions (moderator+ role required)
    if (!(await AuthUtils.checkPermission(authUser, response, "moderator"))) {
      return;
    }

    // Parse the report ID parameter
    const reportId = AuthUtils.parseIdParam(request, response);
    if (reportId === undefined) return;

    // Get data from request body
    const { status = "resolved", note } = request.body as {
      status?: "resolved" | "invalid" | "investigating";
      note?: string;
    };

    try {
      // Check if the report exists
      const reportData = await db.query.stringReports.findFirst({
        where: (r, { eq }) => eq(r.id, reportId),
      });

      if (!reportData) {
        response.status(404).send({
          message: "Report not found",
        });
        return;
      }

      // Prepare update data
      const updateData: any = {
        status,
        resolutionNote: note || reportData.resolutionNote,
      };

      // Only set resolved data if changing to resolved/invalid status
      if (status === "resolved" || status === "invalid") {
        updateData.resolvedById = authUser.id;
        updateData.resolvedAt = new Date();
      } else {
        // For investigating status, make sure these are null
        updateData.resolvedById = null;
        updateData.resolvedAt = null;
      }

      // Update the report
      const [updatedReport] = await db
        .update(stringReports)
        .set(updateData)
        .where(eq(stringReports.id, reportId))
        .returning({
          id: stringReports.id,
          status: stringReports.status,
          resolvedAt: stringReports.resolvedAt,
          resolvedById: stringReports.resolvedById,
          resolutionNote: stringReports.resolutionNote,
        });

      response.status(200).send({
        message: `Report updated to ${status} successfully`,
        report: updatedReport,
      });
    } catch (error) {
      console.error("Error resolving string report:", error);
      response.status(400).send({
        message: "Failed to resolve report",
      });
    }
  },
} as APIRoute;
