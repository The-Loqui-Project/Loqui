import APIRoute from "../../../route";
import db from "../../../../db";
import { AuthUtils } from "../../../../util/auth-utils";
import { asc, desc, eq, sql } from "drizzle-orm";
import { proposalReport } from "../../../../db/schema/schema";

export default {
  type: "GET",
  route: "/proposals/reports",
  schema: {
    description: "List all proposal reports (for moderator+ roles)",
    tags: ["proposals", "reports"],
    security: [{ modrinthToken: [] }],
    querystring: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["open", "investigating", "resolved", "invalid", "all"],
          description: "Filter reports by status (default: open)",
        },
        reporterId: {
          type: "string",
          description: "Filter reports by reporter (default: none)",
        },
        limit: {
          type: "number",
          description:
            "Limit the number of reports returned (default: 50, max: 200)",
        },
        offset: {
          type: "number",
          description: "Offset for pagination (default: 0)",
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
                proposal: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    value: { type: "string" },
                    status: { type: "string" },
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

    // Check if user has appropriate permissions (moderator+ role required for non-self reports)
    if (
      authUser.modrinthUser?.id != (request.params as any).reporterId &&
      !(await AuthUtils.checkPermission(authUser, response, "moderator"))
    ) {
      return;
    }

    try {
      const {
        status = "open",
        limit = 50,
        offset = 0,
      } = request.query as {
        status?: "open" | "investigating" | "resolved" | "invalid" | "all";
        limit?: number;
        offset?: number;
      };

      // Validate and clamp limit
      const parsedLimit = Math.min(Math.max(1, parseInt(String(limit))), 200);
      const parsedOffset = Math.max(0, parseInt(String(offset)));

      // Build the query filters
      let where: any = undefined;
      if (status !== "all") {
        where = (r, { eq }) => eq(r.status, status);
      }

      // Get the reports with pagination
      const reports = await db.query.proposalReport.findMany({
        where,
        limit: parsedLimit,
        offset: parsedOffset,
        with: {
          proposal: {
            columns: {
              id: true,
              value: true,
              status: true,
            },
          },
          reporter: {
            columns: {
              id: true,
              role: true,
            },
          },
          resolvedBy: {
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

      // Get total count for pagination
      let totalCount;

      if (status !== "all") {
        // Count with filter
        const result = await db
          .select({ count: sql`COUNT(*)` })
          .from(proposalReport)
          .where(eq(proposalReport.status, status));
        totalCount = Number(result[0].count);
      } else {
        // Count all
        const result = await db
          .select({ count: sql`COUNT(*)` })
          .from(proposalReport);
        totalCount = Number(result[0].count);
      }

      response.status(200).send({
        reports,
        total: totalCount,
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
      response.status(400).send({
        message: "Failed to fetch reports",
      });
    }
  },
} as APIRoute;
