import APIRoute from "../../../route";
import validateModrinthToken from "../../../../util/auth";
import axios from "axios";
import db from "../../../../db";
import { AuthUtils, ModrinthPermissions } from "../../../../util/auth-utils";
import { Project } from "typerinth";

export default {
  type: "GET",
  route: "/projects/management/user-projects",
  schema: {
    description:
      "Get list of projects that the authenticated user is authorized to manage",
    security: [{ modrinthToken: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          projects: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Modrinth project ID" },
                title: { type: "string", description: "Project title" },
                description: {
                  type: "string",
                  description: "Project description",
                },
                icon_url: {
                  type: "string",
                  nullable: true,
                  description: "Project icon URL",
                },
                slug: { type: "string", description: "Project slug" },
                project_type: { type: "string", description: "Project type" },
                optedIn: {
                  type: "boolean",
                  description:
                    "Whether the project is already opted in to Loqui",
                },
                team: {
                  type: "string",
                  description: "ID of the team that owns this project",
                },
              },
            },
          },
        },
      },
      401: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      400: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  func: async (request, response) => {
    const authorization = request.headers.authorization;
    if (!authorization) {
      response.status(401).send({
        message: "Unauthorized - Missing Modrinth Token",
      });
      return;
    }

    const tokenValid = await validateModrinthToken(authorization);
    if (!tokenValid) {
      response.status(401).send({
        message: "Unauthorized - Invalid Modrinth Token",
      });
      return;
    }

    try {
      // First, get the current user ID from Modrinth
      const currentUserResponse = await axios.get(
        "https://api.modrinth.com/v2/user",
        {
          headers: {
            Authorization: authorization,
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

      // Get user's projects from Modrinth
      const userProjectsResponse = await axios.get(
        `https://api.modrinth.com/v2/user/${userId}/projects`,
      );

      if (
        !userProjectsResponse.data ||
        !Array.isArray(userProjectsResponse.data)
      ) {
        response.status(400).send({
          message: "Failed to get user's projects from Modrinth",
        });
        return;
      }

      const userProjects = userProjectsResponse.data;
      const projectsWithPermissions: Project[] = [];

      // For each project, check team membership to verify the user has MANAGE_INVITES permission
      for (const proj of userProjects) {
        const result = await AuthUtils.checkModrinthProjectPermission(
          proj.id,
          userId,
          authorization,
          ModrinthPermissions.MANAGE_INVITES,
        );

        if (result.hasPermission) {
          projectsWithPermissions.push({
            ...proj,
            team_id: result.teamId,
          });
        }
      }

      // Get IDs of all projects the user has permission to manage
      const projectIds = projectsWithPermissions.map((p) => p.id);

      // Check which projects are already opted into Loqui
      const existingProjects = await db.query.project.findMany({
        where: (project, { inArray }) => inArray(project.id, projectIds),
        columns: {
          id: true,
          optIn: true,
        },
      });

      // Create a map of existing projects
      const existingProjectsMap = new Map();
      existingProjects.forEach((p) => {
        existingProjectsMap.set(p.id, p.optIn !== null);
      });

      // Format response data
      const formattedProjects = projectsWithPermissions.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        icon_url: p.icon_url,
        slug: p.slug,
        project_type: p.project_type,
        optedIn: existingProjectsMap.has(p.id) && existingProjectsMap.get(p.id),
        team: p.team,
      }));

      response.status(200).send({
        projects: formattedProjects,
      });
    } catch (error) {
      console.error("Error fetching user's projects from Modrinth:", error);
      response.status(400).send({
        message: "Failed to fetch user's projects from Modrinth",
      });
    }
  },
} as APIRoute;
