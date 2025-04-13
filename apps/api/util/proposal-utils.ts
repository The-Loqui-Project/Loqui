import db from "../db";
import { proposal } from "../db/schema/schema";
import { and, eq, not, sql } from "drizzle-orm";

/**
 * Updates proposal statuses based on their votes and relative ranking within a translation
 * Rules:
 * 1. Proposal with highest rank (score + approvals*4) becomes "accurate" if score >= 0
 * 2. If only one proposal exists with zero votes, it can be "accurate"
 * 3. Proposal with negative score cannot be "accurate"
 * 4. All other proposals are set to "pending"
 *
 * @param translationId The ID of the translation to update proposals for
 * @param skipProposalId Optional ID of a proposal to skip (e.g., if it's being deleted)
 */
export async function updateProposalStatuses(
  translationId: number,
  skipProposalId?: number,
): Promise<void> {
  try {
    // Get all proposals for this translation
    const proposals = await db.query.proposal.findMany({
      where: (p, { and, eq, not }) => {
        const conditions = [eq(p.translationId, translationId)];

        // Skip the specified proposal if provided
        if (skipProposalId !== undefined) {
          conditions.push(not(eq(p.id, skipProposalId)));
        }

        return and(...conditions);
      },
    });

    if (proposals.length === 0) {
      // No proposals to update
      return;
    }

    // Calculate rank for each proposal
    const rankedProposals = proposals.map((p) => ({
      id: p.id,
      score: p.score,
      approvals: p.approvals,
      rank: p.score + p.approvals * 4,
    }));

    // Sort by rank (highest first)
    rankedProposals.sort((a, b) => b.rank - a.rank);

    // Find the highest ranked proposal
    const topProposal = rankedProposals[0];

    // Special case: if there's only one proposal
    if (rankedProposals.length === 1) {
      // Only mark as accurate if score is not negative
      const newStatus = topProposal.score >= 0 ? "accurate" : "pending";

      await db
        .update(proposal)
        .set({ status: newStatus })
        .where(eq(proposal.id, topProposal.id));

      return;
    }

    // Multi-proposal case
    for (let i = 0; i < rankedProposals.length; i++) {
      const p = rankedProposals[i];
      // Top proposal gets "accurate" status if score is non-negative
      // All others get "pending"
      const newStatus = i === 0 && p.score >= 0 ? "accurate" : "pending";

      await db
        .update(proposal)
        .set({ status: newStatus })
        .where(eq(proposal.id, p.id));
    }
  } catch (error) {
    console.error("Error updating proposal statuses:", error);
    throw error;
  }
}
