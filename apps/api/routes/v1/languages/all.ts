import APIRoute from "../../route";
import db from "../../../db";
import { language } from "../../../db/schema/schema";

export default {
  type: "GET",
  route: "/languages",
  schema: {
    description: "Get all available languages for translation",
    tags: ["languages"],
    response: {
      200: {
        type: "array",
        description: "An array of available languages",
        items: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "Language code (e.g., 'en_us', 'de_de')",
            },
            name: {
              type: "string",
              description: "Language name (e.g., 'English', 'German')",
            },
            nativeName: {
              type: "string",
              description:
                "Native name of the language (e.g., 'English', 'Deutsch')",
            },
          },
        },
      },
    },
  },
  func: async (_request, response) => {
    try {
      const languages = await db.query.language.findMany({
        orderBy: (lang, { asc }) => asc(lang.name),
      });

      response.status(200).send(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      response.status(400).send({
        message: "Failed to fetch languages",
      });
    }
  },
} as APIRoute;
