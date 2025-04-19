import APIRoute from "../../route";
import db from "../../../db";
import { item, stringReports } from "../../../db/schema/schema";
import { AuthUtils } from "../../../util/auth-utils";
import { eq } from "drizzle-orm";

export default {
  type: "POST",
  route: "/string/:id/report",
  schema: {
    description:
      "Report an original English string as inappropriate or offensive",
    tags: ["proposals"],
    security: [{ modrinthToken: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID of the string to report" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Reason for reporting the string",
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

    // Parse the string ID parameter
    const stringId = AuthUtils.parseIdParam(request, response);
    if (stringId === undefined) return;

    const { reason } = request.body as { reason: string };
    if (!reason || reason.trim().length === 0) {
      response.status(400).send({
        message: "Reason is required for reporting a string",
      });
      return;
    }

    try {
      // Get the string
      const stringData = await db.query.item.findFirst({
        where: (i, { eq }) => eq(i.id, stringId),
        with: {
          versionToItems: {
            with: {
              version: {
                with: {
                  project: true,
                },
              },
            },
          },
        },
      });

      if (!stringData) {
        response.status(404).send({
          message: "String not found",
        });
        return;
      }

      // Store the report in the database
      const [newReport] = await db
        .insert(stringReports)
        .values({
          stringId: stringId,
          userId: authUser.id,
          reason: reason,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: stringReports.id });

      // Get affected projects for logging purposes
      const projects = Array.from(
        new Set(stringData.versionToItems.map((vti) => vti.version.project.id)),
      );

      console.log(
        `String ID ${stringId} (${stringData.key}) reported by user ${authUser.id}`,
      );
      console.log(`Affected projects: ${projects.join(", ")}`);
      console.log(`Report ID: ${newReport.id}`);

      response.status(200).send({
        message: "String reported successfully. Our moderators will review it.",
        reportId: newReport.id,
      });
    } catch (error) {
      console.error("Error reporting string:", error);
      response.status(400).send({
        message: "Failed to report string",
      });
    }
  },
} as APIRoute;
