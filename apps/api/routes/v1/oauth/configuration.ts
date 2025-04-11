import APIRoute from "../../route";

export default {
  type: "GET",
  route: "/oauth/configuration",
  schema: {
    description: "Get's the current Modrinth OAuth2 configuration.",
    tags: ["auth"],
    response: {
      200: {
        type: "object",
        properties: {
          scopes: {
            type: "string",
            description:
              "The scopes required by Loqui when authenticating with the Modrinth API.",
          },
          client_id: {
            type: "string",
            description: "The Modrinth application's ID.",
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
    },
  },
  func: async (request, response) => {
    // REMINDER: Update this when changing the scopes used by Loqui.
    const scopes = ["USER_READ", "PROJECT_READ", "VERSION_READ"];

    response.send({
      scopes: scopes.join("+"),
      client_id: "x4bdXz3R",
    });
  },
} as APIRoute;
