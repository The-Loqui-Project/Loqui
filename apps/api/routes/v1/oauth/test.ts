import { FastifyRequest, FastifyReply } from "fastify";
import APIRoute from "../../route";
import axios from "axios";

export default {
  type: "GET",
  func: async (
    request: FastifyRequest,
    response: FastifyReply,
  ): Promise<void> => {
    const authorization = request.headers.authorization;

    // https://api.modrinth.com/v2/user
    try {
      const mr__response = await axios.get("https://api.modrinth.com/v2/user", {
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
      });

      response.send(mr__response.data);
    } catch (e) {
      response.status(400).send({
        message: "Failed to authenticate with Modrinth API. ",
        error: e,
      });
    }
  },
} as APIRoute;
