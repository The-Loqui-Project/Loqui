import APIRoute from "../../../route";
import validateModrinthToken from "../../../../util/auth";
import db from "../../../../db";
import { project } from "../../../../db/schema/schema";
import axios from "axios";
import { AuthUtils, ModrinthPermissions } from "../../../../util/auth-utils";

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
      // First, get the current user ID from Modrinth
      const currentUserResponse = await axios.get(
        "https://api.modrinth.com/v2/user",
        {
          headers: {
            Authorization: authorization!,
          },
        },
      );

      const userId = currentUserResponse.data.id;
      if (!userId) {
        response.status(400).send({
          message: "Failed to get user information from Modrinth",
        });
        return;
      }

      const projects = request.body as string[];

      // Check permissions for all submitted projects
      const { authorizedProjects, unauthorizedProjects } =
        await AuthUtils.checkModrinthProjectsPermissions(
          projects,
          userId,
          authorization!,
          ModrinthPermissions.MANAGE_INVITES,
        );

      // If none of the requested projects are authorized, return 403
      if (authorizedProjects.length === 0) {
        response.status(403).send({
          message:
            "You don't have permission to opt-out any of these projects. MANAGE_INVITES permission is required.",
          failedProjects: unauthorizedProjects,
        });
        return;
      }

      // Check which projects exist in the database
      const existingProjects = await db.query.project.findMany({
        where: (project, { inArray }) =>
          inArray(project.id, authorizedProjects),
        columns: {
          id: true,
        },
      });

      const existingIDs = new Set(existingProjects.map((p) => p.id));
      const projectsToOptOut = authorizedProjects.filter((id) =>
        existingIDs.has(id),
      );

      if (projectsToOptOut.length > 0) {
        await db
          .update(project)
          .set({ optIn: null })
          .where(((project, { inArray }) =>
            inArray(project.id, projectsToOptOut)) as any);
      }

      // Combine unauthorized and invalid projects as failed projects
      const invalidIDs = authorizedProjects.filter(
        (id) => !existingIDs.has(id),
      );
      const allFailedProjects = [...unauthorizedProjects, ...invalidIDs];

      if (allFailedProjects.length > 0) {
        response.status(206).send({
          message:
            unauthorizedProjects.length > 0
              ? "Some projects were opted out successfully. Some project IDs were invalid or you don't have the MANAGE_INVITES permission for them."
              : "We are processing the submitted opt-out requests. Some project IDs were invalid.",
          failedProjects: allFailedProjects,
        });
      } else {
        response.status(200).send({
          message: "We have successfully processed the opt-out requests.",
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
