import APIRoute from "../../../route";
import db from "../../../../db";
import { eq } from "drizzle-orm";
import { project } from "../../../../db/schema/schema";

export default {
  type: "POST",
  route: "/project/:id/report",
  schema: {
    description: "Report a project for a given reason.",
    body: {
      type: "object",
      properties: {
        reason: { type: "string" },
      },
      required: ["reason"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      404: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  func: async (request, response) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason: string };

    // Verify project
    const foundProject = await db.query.project.findFirst({
      where: (proj, { eq }) => eq(proj.id, id),
    });
    if (!foundProject) {
      response.status(404).send({ message: "Project not found." });
      return;
    }

    // TODO: Handle the report.

    response.status(200).send({ message: "Report received." });
  },
} as APIRoute;
