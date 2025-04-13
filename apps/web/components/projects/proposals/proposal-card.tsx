import { useState } from "react";
import { Loader2, Pencil, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Proposal } from "./types";

interface ProposalCardProps {
  proposal: Proposal;
  stringId: string;
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

export default function ProposalCard({
  proposal,
  stringId,
  onVote,
  onDelete,
  onEdit,
  deleting,
  editing,
}: ProposalCardProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(proposal.value);
  const [editNote, setEditNote] = useState(proposal.note || "");

  const startEditing = () => {
    setIsEditing(true);
    setEditValue(proposal.value);
    setEditNote(proposal.note || "");
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditValue(proposal.value);
    setEditNote(proposal.note || "");
  };

  const handleSaveEdit = async () => {
    await onEdit(proposal.id, editValue, editNote);
    setIsEditing(false);
  };

  const isOwnProposal = proposal.user?.id === user?.modrinthUserData?.id || "";
  const canEditOrDelete = isOwnProposal && proposal.score === 0;

  return (
    <div
      className={cn(
        "border rounded-md p-3",
        proposal.status === "accurate" &&
          "border-green-500/30 bg-green-50/30 dark:bg-green-950/10",
        proposal.status === "inaccurate" &&
          "border-red-500/30 bg-red-50/30 dark:bg-red-950/10",
        isEditing && "border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/10",
      )}
    >
      {isEditing ? (
        // Editing interface
        <div className="space-y-3">
          <Textarea
            className="min-h-24 resize-none"
            value={editValue}
            placeholder="Enter translation..."
            onChange={(e) => setEditValue(e.target.value)}
          />
          <Textarea
            className="resize-none h-16 text-sm"
            value={editNote}
            placeholder="Add notes or context (optional)..."
            onChange={(e) => setEditNote(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancelEditing}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={editing[proposal.id]}
            >
              {editing[proposal.id] ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      ) : (
        // Normal display interface
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {proposal.status === "accurate" && (
                <Badge className="bg-green-500">Accurate</Badge>
              )}
              {proposal.status === "inaccurate" && (
                <Badge className="bg-red-500">Inaccurate</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                by {proposal.user?.id || "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {isOwnProposal ? (
                <div className="flex items-center">
                  <Badge className="bg-blue-500 mr-2">Yours</Badge>
                  {/* Only show edit/delete options if score is 0 */}
                  {canEditOrDelete && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-blue-500 hover:text-blue-600"
                        onClick={startEditing}
                        title="Edit proposal"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => onDelete(proposal.id)}
                        disabled={deleting[proposal.id]}
                        title="Delete proposal"
                      >
                        {deleting[proposal.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onVote(stringId, proposal.id, "up")}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <span className="mx-1 text-sm font-medium">
                    {proposal.score}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onVote(stringId, proposal.id, "down")}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <p className="mb-1">{proposal.value}</p>
          {proposal.note && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Note:</span> {proposal.note}
            </p>
          )}
          <div className="mt-2 flex justify-end">
            <span className="text-xs text-muted-foreground">
              {proposal.score > 0
                ? "Leading proposal"
                : "Vote to support this proposal"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
