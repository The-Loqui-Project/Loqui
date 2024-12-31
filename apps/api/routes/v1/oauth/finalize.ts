import APIRoute from "../../route";
import axios from "axios";
import db from "../../../db";
import { URLSearchParams } from "url";
import { user } from "../../../db/schema/schema";
import { User } from "typerinth/dist/interfaces/users";

export default {
  type: "POST",
  route: "/oauth/finalize",
  schema: {
    tags: ["auth"],
    description:
      "Finalizes the OAuth2 process with Modrinth by creating user records in the Loqui database. Handles token generation as well through the Modrinth API.",
    body: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The authorization code received from OAuth2 provider",
        },
        redirect_uri_used: {
          type: "string",
          description: "The redirect URI used in the OAuth2 process",
        },
      },
    },
    response: {
      201: {
        description: "Successful request.",
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "The generated authentication token",
          },
          expiration: {
            type: "number",
            description: "Token expiration timestamp",
          },
          modrinthResponse: {
            type: "object",
            description: "User information object retrieved from Modrinth",
            additionalProperties: true,
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
      409: {
        description: "User already exists!",
        type: "object",
        properties: {
          message: { type: "string" },
          userID: { type: "string" },
        },
      },
    },
  },
  func: async (request, response) => {
    const {
      code,
      redirect_uri_used,
    }: { code: string; redirect_uri_used: string } = request.body as any;

    const modrinthParams: URLSearchParams = new URLSearchParams({
      code: code,
      client_id: "x4bdXz3R",
      redirect_uri: redirect_uri_used,
      grant_type: "authorization_code",
    });

    try {
      const modrinthResponse: {
        access_token: string;
        token_type: "Bearer";
        expires_in: number;
      } = (
        await axios.post(
          "https://api.modrinth.com/_internal/oauth/token",
          modrinthParams,
          {
            headers: {
              Authorization: process.env.MODRINTH_CLIENT_SECRET!,
            },
          },
        )
      ).data;

      // Get user's modrinth ID from modrinthResponse access_token
      const userInformation: User = (
        await axios.get("https://api.modrinth.com/v2/user", {
          headers: {
            Authorization: `${modrinthResponse.token_type} ${modrinthResponse.access_token}`,
          },
        })
      ).data;

      const userID = userInformation.id;
      const userResult = await db.query.user.findFirst({
        where: (users, { eq }) => eq(users.id, userID),
      });

      if (!userResult) {
        await db.insert(user).values({ id: userID });
      }

      response.status(201).send({
        token: modrinthResponse.access_token,
        expiration: modrinthResponse.expires_in,
        modrinthResponse: userInformation,
      });
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
