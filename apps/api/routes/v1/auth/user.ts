import APIRoute from "../../route";
import { AuthUtils } from "../../../util/auth-utils";

export default {
  type: "GET",
  route: "/auth/user",
  schema: {
    description: "Get information about the authenticated user",
    tags: ["auth"],
    security: [{ modrinthToken: [] }],
    response: {
      200: {
        type: "object",
        properties: {
          id: { type: "string" },
          username: { type: "string" },
          role: { type: "string" },
          isModerator: { type: "boolean" },
          isAdmin: { type: "boolean" },
        },
      },
      401: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  func: async (request, response) => {
    const authUser = await AuthUtils.authenticateUser(request, response, {
      requireDbUser: true,
    });

    // If auth failed, the function would have already sent a response
    if (!authUser) return;

    // Check user's role
    const isModerator = ["moderator", "admin"].includes(authUser.role);
    const isAdmin = authUser.role === "admin";

    // Return user information
    response.status(200).send({
      id: authUser.id,
      username: authUser.username,
      role: authUser.role,
      isModerator,
      isAdmin,
    });
  },
} as APIRoute;
