import APIRoute from "../../../route";
import validateModrinthToken from "../../../../util/auth";
import axios from "axios";
import db from "../../../../db";
import { project } from "../../../../db/schema/schema";
import { Project } from "typerinth";
import checkForNewVersions from "../../../../util/modrinth";

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
      const idsString = '["' + projects.join('","') + '"]';

      // https://docs.modrinth.com/api/operations/getprojects/
      const projectsInfos: Project[] = (
        await axios("https://api.modrinth.com/v2/projects", {
          params: {
            ids: idsString,
          },
        })
      ).data;

      const fetchedProjectIDs: string[] = [];
      const projectIds = projectsInfos.map((p) => p.id);
      const existingProjects = await db.query.project.findMany({
        where: (project, { inArray }) => inArray(project.id, projectIds),
        columns: {
          id: true,
          optIn: false,
        },
      });

      const existingIDs = new Set(existingProjects.map((p) => p.id));
      const newProjects = projectsInfos
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

      const invalidIDs = projects.filter(
        (id) => !fetchedProjectIDs.includes(id),
      );

      if (invalidIDs.length > 0) {
        response.status(206).send({
          message:
            "We are processing some submitted projects. Some project IDs were invalid.",
          failedProjects: invalidIDs,
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
