import APIRoute from "../../route";
import db from "../../../db";
import { AuthUtils } from "../../../util/auth-utils";

export default {
  type: "GET",
  route: "/proposals/:id",
  schema: {
    description: "Get a proposal by ID with its associated string information",
    tags: ["proposals"],
    params: {
      type: "object",
      properties: {
        id: { type: "number", description: "ID of the proposal to retrieve" },
      },
      required: ["id"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          proposal: {
            type: "object",
            properties: {
              id: { type: "number" },
              value: { type: "string" },
              note: { type: "string" },
              status: { type: "string" },
              score: { type: "number" },
              translation: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  languageCode: { type: "string" },
                  item: {
                    type: "object",
                    properties: {
                      id: { type: "number" },
                      key: { type: "string" },
                      value: { type: "string" },
                    },
                  },
                },
              },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  role: { type: "string" },
                },
              },
            },
          },
        },
      },
      404: {
        type: "object",
        properties: {
          message: { type: "string", description: "Not found message" },
        },
      },
      400: {
        type: "object",
        properties: {
          message: { type: "string", description: "Error message" },
        },
      },
    },
  },
  func: async (request, response) => {
    // Parse the proposal ID parameter
    const proposalId = AuthUtils.parseIdParam(request, response);
    if (proposalId === undefined) return;

    try {
      // Get proposal with related data (translation, item, user)
      const proposalData = await db.query.proposal.findFirst({
        where: (p, { eq }) => eq(p.id, proposalId),
        with: {
          translation: {
            with: {
              item: true,
            },
          },
          user: {
            columns: {
              id: true,
              role: true,
            },
          },
        },
      });

      if (!proposalData) {
        response.status(404).send({
          message: "Proposal not found",
        });
        return;
      }

      // Send the proposal with all its related information
      response.status(200).send({
        proposal: {
          id: proposalData.id,
          value: proposalData.value,
          note: proposalData.note,
          status: proposalData.status,
          score: proposalData.score,
          translation: {
            id: proposalData.translation.id,
            languageCode: proposalData.translation.languageCode,
            item: {
              id: proposalData.translation.item.id,
              key: proposalData.translation.item.key,
              value: proposalData.translation.item.value,
            },
          },
          user: proposalData.user,
        },
      });
    } catch (error) {
      console.error("Error fetching proposal:", error);
      response.status(400).send({
        message: "Failed to fetch proposal",
      });
    }
  },
} as APIRoute;
