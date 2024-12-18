import APIRoute from "../../../route";
import validateModrinthToken from "../../../../util/auth";

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
    console.log(authorization);
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

      console.log("Found projects");
      console.log(projects);
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
