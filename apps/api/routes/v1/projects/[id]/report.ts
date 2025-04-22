import APIRoute from "../../../route";
import db from "../../../../db";
import { eq } from "drizzle-orm";
import { project, projectReports } from "../../../../db/schema/schema";
import { AuthUtils } from "../../../../util/auth-utils";

export default {
  type: "POST",
  route: "/project/:id/report",
  schema: {
    description: "Report a project for a given reason.",
    security: [{ modrinthToken: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID of the project to report" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Reason for reporting the project",
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

    const { id } = request.params as { id: string };
    const { reason, priority = "medium" } = request.body as {
      reason: string;
      priority?: "low" | "medium" | "high" | "critical";
    };

    if (!reason || reason.trim().length === 0) {
      response.status(400).send({
        message: "Reason is required for reporting a project",
      });
      return;
    }

    try {
      // Verify project
      const foundProject = await db.query.project.findFirst({
        where: (proj) => eq(proj.id, id),
      });

      if (!foundProject) {
        response.status(404).send({ message: "Project not found." });
        return;
      }

      // Check if this user has already reported this project and has an unresolved report
      const existingReport = await db.query.projectReports.findFirst({
        where: (r, { and, eq, not, inArray }) =>
          and(
            eq(r.projectId, id),
            eq(r.reporterId, authUser.id),
            not(inArray(r.status, ["resolved", "invalid"])),
          ),
      });

      if (existingReport) {
        response.status(400).send({
          message:
            "You have already reported this project and your report is still being processed",
        });
        return;
      }

      // Create the report in the database
      const [newReport] = await db
        .insert(projectReports)
        .values({
          projectId: id,
          reporterId: authUser.id,
          reason: reason.trim(),
          priority,
          status: "open",
        })
        .returning({ id: projectReports.id });

      console.log(`Project ID ${id} reported by user ${authUser.id}`);
      console.log(`Report ID: ${newReport.id}`);

      response.status(200).send({
        message:
          "Project reported successfully. Our moderators will review it.",
        reportId: newReport.id,
      });
    } catch (error) {
      console.error("Error reporting project:", error);
      response.status(400).send({
        message: "Failed to report project",
      });
    }
  },
} as APIRoute;
