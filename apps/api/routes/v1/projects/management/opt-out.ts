import APIRoute from "../../../route";
import validateModrinthToken from "../../../../util/auth";
import db from "../../../../db";
import { project } from "../../../../db/schema/schema";

export default {
  type: "POST",
  route: "/projects/management/opt-out",
  schema: {
    description: "Opt-out one or more projects from the Loqui system.",
    body: {
      type: "array",
      description: "An array of Modrinth project IDs",
      items: {
        type: "string",
        description: "Modrinth project ID",
      },
    },
    security: [{ modrinthToken: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description:
              "A confirmation message to say that projects were successfully opted out.",
          },
        },
      },
      206: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description:
              "A confirmation message to say that some projects were successfully opted out.",
          },
          failedProjects: {
            type: "array",
            description:
              "An array of Modrinth project IDs which failed to be opted out from Loqui.",
            items: {
              type: "string",
              description: "Modrinth project IDs",
            },
          },
        },
      },
      400: {
        description: "Request failed.",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      401: {
        description: "Request failed - invalid token.",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  func: async (request, response) => {
    const authorization = request.headers.authorization;
    const tokenValid = await validateModrinthToken(
      authorization ?? "undefined_token",
    );

    if (!tokenValid) {
      response.status(400).send({
        message: "Unauthorized - Invalid Modrinth Token.",
      });
      return;
    }

    try {
      const projects = request.body as string[];
      const existingProjects = await db.query.project.findMany({
        where: (project, { inArray }) => inArray(project.id, projects),
        columns: {
          id: true,
        },
      });

      const existingIDs = new Set(existingProjects.map((p) => p.id));
      const projectsToOptOut = projects.filter((id) => existingIDs.has(id));

      if (projectsToOptOut.length > 0) {
        await db
          .update(project)
          .set({ optIn: null })
          .where(((project, { inArray }) =>
            inArray(project.id, projectsToOptOut)) as any);
      }

      const invalidIDs = projects.filter((id) => !existingIDs.has(id));

      if (invalidIDs.length > 0) {
        response.status(206).send({
          message:
            "We are processing some submitted projects. Some project IDs were invalid.",
          failedProjects: invalidIDs,
        });
      } else {
        response.status(200).send({
          message: "We are processing the submitted projects.",
        });
      }
    } catch (e) {
      request.log.error(
        "Request failed, unable to communicate with Modrinth API.",
      );
      console.error(e);
      response.status(400).send({
        message:
          "Failed to communicate with Modrinth API - " +
          new Date().toUTCString(),
      });
      return;
    }
  },
} as APIRoute;
