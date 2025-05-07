import db from "../db";
import {
  proposal,
  translation,
  versionToItem,
  versionTranslationPackStatus,
} from "../db/schema/schema";
import { and, eq, inArray, not, sql } from "drizzle-orm";

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
      status: p.status, // Keep track of original status
    }));

    // Sort by rank (highest first)
    rankedProposals.sort((a, b) => b.rank - a.rank);

    // Find the highest ranked proposal
    const topProposal = rankedProposals[0];
    let newAccurateProposalIds: number[] = [];

    // Special case: if there's only one proposal
    if (rankedProposals.length === 1) {
      // Only mark as accurate if score is not negative
      const newStatus = topProposal.score >= 0 ? "accurate" : "pending";

      await db
        .update(proposal)
        .set({ status: newStatus })
        .where(eq(proposal.id, topProposal.id));

      // If status changed to accurate, track it
      if (newStatus === "accurate" && topProposal.status !== "accurate") {
        newAccurateProposalIds.push(topProposal.id);
      }

      if (newAccurateProposalIds.length > 0) {
        await markVersionsAsDirty(translationId, newAccurateProposalIds);
      }
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

      // If status changed to accurate, track it
      if (newStatus === "accurate" && p.status !== "accurate") {
        newAccurateProposalIds.push(p.id);
      }
    }

    // If any proposals became accurate, mark relevant versions as dirty
    if (newAccurateProposalIds.length > 0) {
      await markVersionsAsDirty(translationId, newAccurateProposalIds);
    }
  } catch (error) {
    console.error("Error updating proposal statuses:", error);
    throw error;
  }
}

/**
 * Marks all versions that contain an item as needing translation pack updates
 * @param translationId The translation ID that was updated
 * @param proposalIds The proposal IDs that became accurate
 */
async function markVersionsAsDirty(
  translationId: number,
  proposalIds: number[],
): Promise<void> {
  try {
    // 1. Get the translation to find item and language
    const translationData = await db.query.translation.findFirst({
      where: (t) => eq(t.id, translationId),
      columns: {
        itemId: true,
        languageCode: true,
      },
    });

    if (!translationData) {
      console.error(`Translation not found for ID: ${translationId}`);
      return;
    }

    // 2. Find all versions that contain this item
    const versionLinks = await db.query.versionToItem.findMany({
      where: (vti) => eq(vti.itemId, translationData.itemId),
      columns: {
        versionId: true,
      },
    });

    const versionIds = versionLinks.map((v) => v.versionId);

    // 3. For each version, mark it as needing a release for this language
    for (const versionId of versionIds) {
      await db
        .insert(versionTranslationPackStatus)
        .values({
          versionId,
          languageCode: translationData.languageCode,
          needsRelease: true,
          lastUpdated: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            versionTranslationPackStatus.versionId,
            versionTranslationPackStatus.languageCode,
          ],
          set: {
            needsRelease: true,
            lastUpdated: new Date(),
          },
        });
    }
  } catch (error) {
    console.error("Error marking versions as dirty:", error);
  }
}
