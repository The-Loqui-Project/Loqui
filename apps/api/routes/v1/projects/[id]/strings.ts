import { request } from "http";
import APIRoute from "../../../route";

export default {
  type: "GET",
  route: "/project/:id/strings",
  schema: {
    description: "Get all strings available to translate from a project.",
    response: {
      200: {
        type: "array",
        description: "An array of strings ready to translate.",
        items: {
          type: "object",
          description: "A project's string.",
          properties: {
            id: { type: "number" },
            key: { type: "string" },
            value: { type: "string" },
            appears_in: {
              type: "array",
              description: "An array of version IDs this string appears in.",
              items: { type: "string" },
            },
          },
        },
      },
      404: {
        type: "object",
        description: "The project was not found.",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  func: async (request, response) => {
    // TODO: Implement
  },
} as APIRoute;
