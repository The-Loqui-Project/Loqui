import APIRoute from "../../route";
import db from "../../../db";
import { AuthUtils } from "../../../util/auth-utils";
import { eq } from "drizzle-orm";

export default {
  type: "GET",
  route: "/string/:id/proposals",
  schema: {
    description: "Get all translation proposals for an English string",
    tags: ["proposals"],
    params: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "ID of the string to get proposals for",
        },
      },
      required: ["id"],
    },
    querystring: {
      type: "object",
      properties: {
        language: {
          type: "string",
          description: "Optional language code to filter proposals by",
        },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          original: {
            type: "object",
            properties: {
              id: { type: "number" },
              key: { type: "string" },
              value: { type: "string" },
            },
          },
          proposals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                value: { type: "string" },
                note: { type: "string" },
                status: { type: "string" },
                score: { type: "number" },
                approvals: { type: "number" },
                rank: { type: "number" },
                language: { type: "string" },
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
    // Parse the string ID parameter
    const stringId = AuthUtils.parseIdParam(request, response);
    if (stringId === undefined) return;

    const query = request.query as { language?: string };
    const languageCode = query.language;

    try {
      // Get the string
      const stringData = await db.query.item.findFirst({
        where: (i, { eq }) => eq(i.id, stringId),
      });

      if (!stringData) {
        response.status(404).send({
          message: "String not found",
        });
        return;
      }

      // Get translations for this string
      let translations;
      if (languageCode) {
        translations = await db.query.translation.findMany({
          where: (t, { and, eq }) =>
            and(eq(t.itemId, stringId), eq(t.languageCode, languageCode)),
        });
      } else {
        translations = await db.query.translation.findMany({
          where: (t, { eq }) => eq(t.itemId, stringId),
        });
      }

      const translationIds = translations.map((t) => t.id);

      if (translationIds.length === 0) {
        // Return early if no translations found
        response.status(200).send({
          original: {
            id: stringData.id,
            key: stringData.key,
            value: stringData.value,
          },
          proposals: [],
        });
        return;
      }

      // Get all proposals for these translations
      const proposals = await db.query.proposal.findMany({
        where: (p, { inArray }) => inArray(p.translationId, translationIds),
        with: {
          translation: true,
          user: true,
        },
      });

      // Calculate rank based on score + (approvals * 4)
      // Group proposals by language
      const proposalsByLanguage = new Map();
      proposals.forEach((p) => {
        const lang = p.translation.languageCode;
        if (!proposalsByLanguage.has(lang)) {
          proposalsByLanguage.set(lang, []);
        }
        proposalsByLanguage.get(lang).push(p);
      });

      // Sort proposals within each language by rank
      const rankedProposals: any[] = [];
      for (const [lang, langProposals] of proposalsByLanguage.entries()) {
        // Sort by rank within each language
        langProposals.sort((a, b) => {
          const rankA = a.score + a.approvals * 4;
          const rankB = b.score + b.approvals * 4;
          return rankB - rankA; // Descending order
        });

        // Add rank property to each proposal
        langProposals.forEach((p) => {
          rankedProposals.push({
            id: p.id,
            value: p.value,
            note: p.note,
            status: p.status,
            score: p.score,
            approvals: p.approvals,
            rank: p.score + p.approvals * 4,
            language: p.translation.languageCode,
            user: {
              id: p.user?.id,
              role: p.user?.role,
            },
          });
        });
      }

      // Return the string data and its proposals
      response.status(200).send({
        original: {
          id: stringData.id,
          key: stringData.key,
          value: stringData.value,
        },
        proposals: rankedProposals,
      });
    } catch (error) {
      console.error("Error fetching string proposals:", error);
      response.status(400).send({
        message: "Failed to fetch proposals",
      });
    }
  },
} as APIRoute;
