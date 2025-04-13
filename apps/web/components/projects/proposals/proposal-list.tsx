import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProposalCard from "./proposal-card";
import { Proposal } from "./types";

interface ProposalListProps {
  stringId: string;
  proposals: Proposal[] | undefined;
  loading: boolean;
  onVote: (
    stringId: string,
    proposalId: string,
    voteType: "up" | "down" | "none",
  ) => Promise<void>;
  onDelete: (proposalId: string) => Promise<void>;
  onEdit: (proposalId: string, value: string, note: string) => Promise<void>;
  deleting: Record<string, boolean>;
  editing: Record<string, boolean>;
}

export default function ProposalList({
  stringId,
  proposals,
  loading,
  onVote,
  onDelete,
  onEdit,
  deleting,
  editing,
}: ProposalListProps) {
  return (
    <div className="mt-4 border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Community Proposals</h3>
        <Badge variant="outline" className="ml-2">
          {proposals?.length || 0} Proposals
        </Badge>
      </div>

      {loading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : proposals && proposals.length > 0 ? (
        <div className="space-y-3">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              stringId={stringId}
              onVote={onVote}
              onDelete={onDelete}
              onEdit={onEdit}
              deleting={deleting}
              editing={editing}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-4">
          No proposals for this string yet. Be the first to contribute!
        </p>
      )}
    </div>
  );
}
