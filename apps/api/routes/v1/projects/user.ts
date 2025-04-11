import APIRoute from "../../route";
import validateModrinthToken from "../../../util/auth";
import db from "../../../db";
import { isNotNull, inArray, and } from "drizzle-orm";
import { project } from "../../../db/schema/schema";
import axios from "axios";
import { User } from "typerinth/dist/interfaces/users";
import { Project } from "typerinth";

export default {
  type: "GET",
  route: "/projects/user",
  schema: {
    description:
      "Get all projects that belong to the authenticated user and are opted into Loqui.",
    tags: ["projects"],
    security: [{ modrinthToken: [] }],
    response: {
      200: {
        type: "array",
        description: "An array of user's projects opted into Loqui.",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Modrinth project ID" },
            title: { type: "string", description: "Project title" },
            description: { type: "string", description: "Project description" },
            icon_url: {
              type: "string",
              description: "URL to the project icon",
            },
            slug: { type: "string", description: "Project slug" },
            optIn: {
              type: "string",
              format: "date-time",
              description: "When the project was opted into Loqui",
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
      // Get the user data from Modrinth
      const userData: User = (
        await axios.get("https://api.modrinth.com/v2/user", {
          headers: {
            Authorization: authorization,
            "Content-Type": "application/json",
          },
        })
      ).data;

      // Get the user's projects from Modrinth
      const projectsData = (
        await axios.get(
          `https://api.modrinth.com/v2/user/${userData.id}/projects`,
          {
            headers: {
              Authorization: authorization,
              "Content-Type": "application/json",
            },
          },
        )
      ).data as Project[];

      // Extract project IDs
      const projectIds = projectsData.map((p) => p.id);

      // Get Loqui projects that match the user's projects
      const loquiProjects = await db
        .select({
          id: project.id,
          optIn: project.optIn,
        })
        .from(project)
        .where(and(inArray(project.id, projectIds), isNotNull(project.optIn)));

      // Make a map of Loqui projects
      const loquiProjectMap = new Map(
        loquiProjects.map((p) => [p.id, p.optIn]),
      );

      // Combine data to return projects with both Modrinth and Loqui info
      const userProjects = projectsData
        .filter((p) => loquiProjectMap.has(p.id))
        .map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          icon_url: p.icon_url,
          slug: p.slug,
          optIn: loquiProjectMap.get(p.id),
        }));

      response.status(200).send(userProjects);
    } catch (error) {
      console.error("Error fetching user projects:", error);
      response.status(400).send({
        message: "Failed to fetch user projects - " + new Date().toUTCString(),
      });
    }
  },
} as APIRoute;
