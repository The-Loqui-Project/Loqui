import APIRoute from "../../route";
import db from "../../../db";
import { isNotNull } from "drizzle-orm";
import { project } from "../../../db/schema/schema";
import axios from "axios";
import { Project } from "typerinth";

export default {
  type: "GET",
  route: "/projects/all",
  schema: {
    description: "Get all projects that are currently opted into Loqui.",
    tags: ["projects"],
    response: {
      200: {
        type: "array",
        description: "An array of projects opted into Loqui.",
      },
    },
  },
  func: async (request, response) => {
    try {
      const projects = await db
        .select({
          id: project.id,
          optIn: project.optIn,
        })
        .from(project)
        .where(isNotNull(project.optIn));

      const projectIDs: string[] = projects.map((project) => project.id);

      // Skip API call if no projects found
      if (projectIDs.length === 0) {
        console.log("No opted-in projects found");
        return response.status(200).send([]);
      }

      console.log(
        `Fetching data for ${projectIDs.length} projects from Modrinth API`,
      );

      // Simplify the request and add error handling
      const modrinthResponse = await axios.get(
        "https://api.modrinth.com/v2/projects",
        {
          params: {
            ids: JSON.stringify(projectIDs),
          },
        },
      );

      const modrinthData = (await modrinthResponse.data) as Project[];

      console.log(
        `Received data for ${modrinthData.length} projects from Modrinth API`,
      );

      // For debugging
      if (modrinthData.length === 0) {
        console.log("Warning: Modrinth API returned no projects");
      }

      response.status(200).send(modrinthData);
    } catch (error) {
      console.error("Error fetching project data:", error);
      response.status(500).send({
        error: "Failed to retrieve projects",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
} as APIRoute;
