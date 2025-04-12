import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  StringItem,
  getStringDetails,
  getStringProposals,
  createProposal,
  editProposal,
  voteOnProposal,
  deleteProposal,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2, ThumbsUp, ThumbsDown, Edit, Trash2 } from "lucide-react";
import { getCookie } from "cookies-next";
import { useRouter, usePathname } from "next/navigation";
import ProposalEditDialog from "./proposal-edit-dialog";

interface ProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  stringItem: StringItem;
  languageCode: string;
}

interface TranslationDetails {
  id: number;
  languageCode: string;
  userId: string | null;
}

export default function ProposalDialog({
  open,
  onOpenChange,
  projectId,
  stringItem,
  languageCode,
}: ProposalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<any[]>([]);
  const [stringDetails, setStringDetails] = useState<any | null>(null);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Find the translation for the current language
  const findTranslation = (): TranslationDetails | null => {
    if (!stringDetails?.translations) return null;
    return (
      stringDetails.translations.find(
        (t: TranslationDetails) => t.languageCode === languageCode,
      ) || null
    );
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, languageCode, stringItem.id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load string details and proposals
      const [detailsData, proposalsData] = await Promise.all([
        getStringDetails(projectId, stringItem.id),
        getStringProposals(stringItem.id, languageCode),
      ]);

      setStringDetails(detailsData);
      setProposals(proposalsData.proposals || []);
    } catch (error) {
      console.error("Error loading string data:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load string data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const token = getCookie("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit translations",
        variant: "destructive",
      });
      router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!value.trim()) {
      toast({
        title: "Error",
        description: "Translation cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const translation = findTranslation();

      if (!translation) {
        toast({
          title: "Error",
          description: "No translation found for selected language",
          variant: "destructive",
        });
        return;
      }

      await createProposal(
        translation.id,
        value,
        note || undefined,
        token.toString(),
      );

      toast({
        title: "Success",
        description: "Your translation proposal has been submitted",
      });

      setValue("");
      setNote("");

      // Refresh the proposals list
      await loadData();
    } catch (error) {
      console.error("Error submitting proposal:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit proposal",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (
    proposalId: number,
    voteType: "up" | "down" | "none",
  ) => {
    const token = getCookie("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to vote",
        variant: "destructive",
      });
      router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    try {
      setLoading(true);
      await voteOnProposal(proposalId, voteType, token.toString());
      await loadData(); // Refresh proposals
      toast({
        title: "Success",
        description: "Your vote has been recorded",
      });
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to register vote",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (proposal: any) => {
    setEditingProposal(proposal);
    setEditDialogOpen(true);
  };

  const handleDelete = async (proposalId: number) => {
    const token = getCookie("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete proposals",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this proposal?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteProposal(proposalId, token.toString());
      await loadData(); // Refresh proposals
      toast({
        title: "Success",
        description: "Proposal deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting proposal:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete proposal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditComplete = async () => {
    setEditDialogOpen(false);
    await loadData(); // Refresh proposals
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accurate":
        return <Badge className="bg-green-500">Accurate</Badge>;
      case "inaccurate":
        return <Badge className="bg-red-500">Inaccurate</Badge>;
      case "removed":
        return <Badge className="bg-gray-500">Removed</Badge>;
      default:
        return <Badge>Pending</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Translate String</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Original String Info */}
            <div>
              <h3 className="font-medium mb-2">Original</h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-2">
                    <Label className="text-xs text-muted-foreground">Key</Label>
                    <p className="font-mono text-sm">{stringItem.key}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      English Value
                    </Label>
                    <p>{stringItem.value}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Existing Proposals */}
            <div>
              <h3 className="font-medium mb-2">Existing Proposals</h3>
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : proposals.length > 0 ? (
                <div className="space-y-3">
                  {proposals.map((proposal) => (
                    <Card key={proposal.id} className="overflow-hidden">
                      <CardHeader className="py-3 px-4 bg-muted/40">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            {getStatusBadge(proposal.status)}
                            <span className="ml-2 font-normal text-muted-foreground">
                              by {proposal.user?.id || "Unknown"}
                            </span>
                          </CardTitle>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleVote(proposal.id, "up")}
                              title="Upvote"
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
                              onClick={() => handleVote(proposal.id, "down")}
                              title="Downvote"
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3 px-4">
                        <p>{proposal.value}</p>
                        {proposal.note && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <span className="font-medium">Note:</span>{" "}
                            {proposal.note}
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="py-2 px-4 bg-muted/20 flex justify-end space-x-1 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(proposal)}
                          className="h-7"
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(proposal.id)}
                          className="h-7 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center p-4">
                  No proposals for this string in {languageCode} yet. Be the
                  first!
                </p>
              )}
            </div>

            {/* New Proposal Form */}
            <div>
              <h3 className="font-medium mb-2">New Proposal</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="translation">Translation</Label>
                  <Textarea
                    id="translation"
                    placeholder="Enter your translation..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="note">Note (Optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Add any notes or context about your translation..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-20"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingProposal && (
        <ProposalEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          proposal={editingProposal}
          onComplete={handleEditComplete}
        />
      )}
    </>
  );
}
