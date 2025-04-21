import APIRoute from "../../route";
import { processTranslationPacksManually } from "../../../util/jobs/translation-packs";
import { AuthUtils } from "../../../util/auth-utils";

export default {
  type: "GET",
  route: "/moderation/translation-packs/process",
  schema: {
    description: "Manually trigger translation pack generation for all projects with pending translations",
    security: [{ modrinthToken: [] }],
    tags: ["moderation"],
    response: {
      202: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "ID of the background task" },
          message: { type: "string", description: "Success message" },
        },
      },
      401: {
        type: "object",
        properties: {
          message: { type: "string", description: "Authentication error message" },
        },
      },
      403: {
        type: "object",
        properties: {
          message: { type: "string", description: "Authorization error message" },
        },
      },
    },
  },
  func: async (request, response) => {
    // const authUser = await AuthUtils.authenticateUser(request, response);

    // if (!authUser) {
    //   response.status(401).send({
    //     message: "You must be logged in to access this endpoint",
    //   });
    //   return;
    // }

    // if (authUser.role !== "admin") {
    //   response.status(403).send({
    //     message: "You do not have permission to access this endpoint",
    //   });
    //   return;
    // }

    try {
      // Run the translation pack generation process in the background
      const taskId = await processTranslationPacksManually();

      response.status(202).send({
        taskId,
        message: "Translation pack generation started successfully",
      });
    } catch (error) {
      console.error("Error starting translation pack generation:", error);
      response.status(500).send({
        message: "An error occurred while starting the translation pack generation",
      });
    }
  },
} as APIRoute;