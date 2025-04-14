import APIRoute from "../../../route";
import validateModrinthToken from "../../../../util/auth";
import axios from "axios";
import db from "../../../../db";
import { project } from "../../../../db/schema/schema";
import checkForNewVersions from "../../../../util/modrinth";
import { AuthUtils, ModrinthPermissions } from "../../../../util/auth-utils";

export default {
  type: "POST",
  route: "/projects/managment/submit",
  schema: {
    description: "Opt-in one or more projects to the Loqui system.",
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
      201: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description:
              "A confirmation message to say that projects were successfully added.",
          },
        },
      },
      206: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description:
              "A confirmation message to say that some projects were successfully added.",
          },
          failedProjects: {
            type: "array",
            description:
              "An array of Modrinth project IDs which failed to be added to Loqui.",
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
      403: {
        description: "Request failed - unauthorized.",
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
      response.status(401).send({
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
      const { authorizedProjects, unauthorizedProjects, projectInfos } =
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
            "You don't have permission to opt-in any of these projects. MANAGE_INVITES permission is required.",
          failedProjects: unauthorizedProjects,
        });
        return;
      }

      // Continue with authorized projects only
      const filteredProjectsInfos =
        projectInfos?.filter((p) => authorizedProjects.includes(p.id)) || [];

      const fetchedProjectIDs: string[] = [];
      const projectIds = filteredProjectsInfos.map((p) => p.id);
      const existingProjects = await db.query.project.findMany({
        where: (project, { inArray }) => inArray(project.id, projectIds),
        columns: {
          id: true,
          optIn: false,
        },
      });

      const existingIDs = new Set(existingProjects.map((p) => p.id));
      const newProjects = filteredProjectsInfos
        .filter(
          (p) =>
            !existingIDs.has(p.id) &&
            // TODO: In future, add support for resource packs and datapacks.
            p.project_type === "mod",
        )
        .map((p) => ({
          id: p.id,
          optIn: new Date(),
        }));

      if (newProjects.length > 0) {
        await db.insert(project).values(newProjects);
        fetchedProjectIDs.push(...newProjects.map((p) => p.id));
      }

      const invalidIDs = authorizedProjects.filter(
        (id) => !fetchedProjectIDs.includes(id),
      );

      // Combine unauthorized and invalid projects as failed projects
      const allFailedProjects = [...unauthorizedProjects, ...invalidIDs];

      if (allFailedProjects.length > 0) {
        response.status(206).send({
          message:
            unauthorizedProjects.length > 0
              ? "Some projects were processed successfully. Some project IDs were invalid or you don't have the MANAGE_INVITES permission for them."
              : "We are processing some submitted projects. Some project IDs were invalid.",
          failedProjects: allFailedProjects,
        });
      } else {
        response.status(201).send({
          message: "We are processing the submitted projects.",
        });
      }

      for (const project of newProjects) {
        await checkForNewVersions(project.id);
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
