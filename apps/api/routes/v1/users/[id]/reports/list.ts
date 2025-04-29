import APIRoute from "../../../../route";
import db from "../../../../../db";
import { AuthUtils } from "../../../../../util/auth-utils";
import { eq, sql } from "drizzle-orm";
import { projectReports } from "../../../../../db/schema/schema";

export default {
  type: "GET",
  route: "/user/:id/reports",
  schema: {
    description: "List a user's reports.",
    tags: ["projects", "reports", "moderation"],
    security: [{ modrinthToken: [] }],
    querystring: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["open", "investigating", "resolved", "invalid", "all"],
          description: "Filter reports by status (default: open)",
        },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          reports: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                priority: { type: "string" },
                status: { type: "string" },
                reason: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
                resolvedAt: { type: "string", format: "date-time" },
                project: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                  },
                },
                reporter: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    role: { type: "string" },
                  },
                },
                resolvedBy: {
                  type: "object",
                  nullable: true,
                  properties: {
                    id: { type: "string" },
                    role: { type: "string" },
                  },
                },
              },
            },
          },
          total: { type: "number" },
        },
      },
      400: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      401: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      403: {
        type: "object",
        properties: {
          message: { type: "string" },
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

    // Check if user has appropriate permissions (moderator+ role required for accessing other users' reports)
    if (
      authUser.id != (request.params as any).id &&
      !(await AuthUtils.checkPermission(authUser, response, "moderator"))
    ) {
      return;
    }

    try {
      const { status = "open" } = request.query as {
        status?: "open" | "investigating" | "resolved" | "invalid" | "all";
      };

      // Build the query filters
      let where: any = undefined;
      if (status !== "all") {
        where = (r, { eq }) => eq(r.status, status);
      }

      // Get the reports
      const reports = await db.query.projectReports.findMany({
        where,
        with: {
          project: {
            columns: {
              id: true,
            },
          },
          reporter: {
            columns: {
              id: true,
              role: true,
            },
          },
          resolver: {
            columns: {
              id: true,
              role: true,
            },
          },
        },
        // Order by priority (critical first), then by creation date (newest first)
        orderBy: (r, { desc }) => [
          // Use a CASE expression for priority sorting
          desc(sql`CASE 
        WHEN ${r.priority} = 'critical' THEN 4
        WHEN ${r.priority} = 'high' THEN 3
        WHEN ${r.priority} = 'medium' THEN 2
        ELSE 1
        END`),
          desc(r.createdAt),
        ],
      });

      // Format reports to match the expected response format
      const formattedReports = reports.map((report) => ({
        id: report.id,
        priority: report.priority,
        status: report.status,
        reason: report.reason,
        createdAt: report.createdAt.toISOString(),
        resolvedAt: report.resolvedAt
          ? report.resolvedAt.toISOString()
          : undefined,
        project: {
          id: report.project.id,
          // Note: Project title isn't stored in the database schema
          // The frontend can fetch this separately from Modrinth API if needed
        },
        reporter: {
          id: report.reporter.id,
          role: report.reporter.role,
        },
        resolvedBy: report.resolver
          ? {
              id: report.resolver.id,
              role: report.resolver.role,
            }
          : undefined,
      }));

      // Get total count
      let totalCount;
      if (status !== "all") {
        // Count with filter
        const result = await db
          .select({ count: sql`COUNT(*)` })
          .from(projectReports)
          .where(eq(projectReports.status, status));
        totalCount = Number(result[0].count);
      } else {
        // Count all
        const result = await db
          .select({ count: sql`COUNT(*)` })
          .from(projectReports);
        totalCount = Number(result[0].count);
      }

      response.status(200).send({
        reports: formattedReports,
        total: totalCount,
      });
    } catch (error) {
      console.error("Error fetching project reports:", error);
      response.status(400).send({
        message: "Failed to fetch project reports",
      });
    }
  },
} as APIRoute;
