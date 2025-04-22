import APIRoute from "../../../route";
import validateModrinthToken from "../../../../util/auth";
import db from "../../../../db";
import { project, user } from "../../../../db/schema/schema";
import axios from "axios";
import { AuthUtils, ModrinthPermissions } from "../../../../util/auth-utils";
import { eq, inArray } from "drizzle-orm";

export default {
  type: "POST",
  route: "/projects/management/opt-out",
  schema: {
    description:
      "Opt-out one or more projects from the Loqui system (project owners or moderators).",
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
    // Authenticate user and check if they exist in the database
    const authUser = await AuthUtils.authenticateUser(request, response, {
      requireDbUser: true,
    });

    // If auth failed, the function would have already sent a response
    if (!authUser) return;

    // Check if the user is a moderator or admin
    const isModerator = ["moderator", "admin"].includes(authUser.role);

    try {
      // Get the projects to opt out
      const projects = request.body as string[];

      if (!isModerator) {
        // For non-moderators, check permissions for all submitted projects
        const { authorizedProjects, unauthorizedProjects } =
          await AuthUtils.checkModrinthProjectsPermissions(
            projects,
            authUser.id,
            request.headers.authorization!,
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

        // For non-moderators, only process authorized projects
        const existingProjects = await db.query.project.findMany({
          where: (projectTable, { inArray }) =>
            inArray(projectTable.id, authorizedProjects),
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
            .where(inArray(project.id, projectsToOptOut));
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
      } else {
        // For moderators, check if the projects exist in the database
        const existingProjects = await db.query.project.findMany({
          where: (projectTable, { inArray }) =>
            inArray(projectTable.id, projects),
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
            .where(inArray(project.id, projectsToOptOut));
        }

        // Check if any projects were not found
        const invalidIDs = projects.filter((id) => !existingIDs.has(id));

        if (invalidIDs.length > 0) {
          response.status(206).send({
            message:
              "Some projects were opted out successfully. Some project IDs were not found in the database.",
            failedProjects: invalidIDs,
          });
        } else {
          response.status(200).send({
            message: "We have successfully processed the opt-out requests.",
          });
        }
      }
    } catch (e) {
      request.log.error("Request failed, error during project opt-out.");
      console.error(e);
      response.status(400).send({
        message:
          "Failed to process opt-out request - " + new Date().toUTCString(),
      });
      return;
    }
  },
} as APIRoute;
