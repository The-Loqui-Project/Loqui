import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getCookie } from "cookies-next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  resolveProposalReport,
  deleteProposal,
  editProposal,
  resetProposalVotes,
} from "@/lib/api-client-wrapper";

interface ProposalReport {
  id: number;
  type: "proposal";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "invalid";
  reason: string;
  createdAt: string;
  resolvedAt?: string;
  content: {
    id: number;
    value?: string;
    status?: string;
  };
  reporter: {
    id: string;
    role: string;
  };
  resolvedBy?: {
    id: string;
    role: string;
  };
}

interface ProposalReportActionModalProps {
  report: ProposalReport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export function ProposalReportActionModal({
  report,
  open,
  onOpenChange,
  onActionComplete,
}: ProposalReportActionModalProps) {
  const { toast } = useToast();
  const [resolutionNote, setResolutionNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [editValue, setEditValue] = useState(report.content.value || "");

  const handleDelete = async () => {
    const token = await getCookie("token");
    if (!token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Delete the proposal
      await deleteProposal(report.content.id, token.toString());

      // Resolve the report
      await resolveProposalReport(
        report.id,
        "resolved",
        `Proposal deleted. Note: ${resolutionNote}`,
        token.toString(),
      );

      toast({
        title: "Success",
        description: "Proposal has been deleted and report resolved",
      });

      onOpenChange(false);
      onActionComplete();
    } catch (error) {
      console.error("Error handling proposal report:", error);
      toast({
        title: "Error",
        description: "Failed to process action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async () => {
    const token = await getCookie("token");
    if (!token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Edit the proposal
      await editProposal(
        report.content.id,
        editValue,
        undefined,
        token.toString(),
      );

      // Resolve the report
      await resolveProposalReport(
        report.id,
        "resolved",
        `Proposal edited. Note: ${resolutionNote}`,
        token.toString(),
      );

      toast({
        title: "Success",
        description: "Proposal has been edited and report resolved",
      });

      onOpenChange(false);
      onActionComplete();
    } catch (error) {
      console.error("Error editing proposal:", error);
      toast({
        title: "Error",
        description: "Failed to edit proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetVotes = async () => {
    const token = await getCookie("token");
    if (!token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Reset proposal votes
      await resetProposalVotes(report.content.id, token.toString());

      // Resolve the report
      await resolveProposalReport(
        report.id,
        "resolved",
        `Proposal votes reset. Note: ${resolutionNote}`,
        token.toString(),
      );

      toast({
        title: "Success",
        description: "Proposal votes have been reset and report resolved",
      });

      onOpenChange(false);
      onActionComplete();
    } catch (error) {
      console.error("Error resetting votes:", error);
      toast({
        title: "Error",
        description: "Failed to reset votes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolve = async (
    status: "resolved" | "investigating" | "invalid",
  ) => {
    const token = await getCookie("token");
    if (!token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      await resolveProposalReport(
        report.id,
        status,
        resolutionNote,
        token.toString(),
      );

      toast({
        title: "Success",
        description: `Report marked as ${status}`,
      });

      onOpenChange(false);
      onActionComplete();
    } catch (error) {
      console.error("Error resolving proposal report:", error);
      toast({
        title: "Error",
        description: "Failed to resolve report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Proposal Report Action</DialogTitle>
          <DialogDescription>
            Take action on the reported proposal. You can edit, delete, or reset
            votes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-xs font-medium mb-1">Proposal Value:</div>
            <div className="text-sm">{report.content.value}</div>
            <div className="mt-2 text-xs font-medium">Report Reason:</div>
            <div className="text-sm text-muted-foreground">{report.reason}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-value">Edit Proposal Value</Label>
            <Input
              id="edit-value"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Edit the proposal value..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution-note">Resolution Note</Label>
            <Textarea
              id="resolution-note"
              placeholder="Add a note about how this report was handled..."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="min-h-24"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleEdit}
              className="flex-1"
              disabled={
                isProcessing || !editValue || editValue === report.content.value
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Edit Proposal"
              )}
            </Button>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
              disabled={isProcessing}
            >
              Delete
            </Button>
            <Button
              variant="secondary"
              onClick={handleResetVotes}
              className="flex-1"
              disabled={isProcessing}
            >
              Reset Votes
            </Button>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => handleResolve("investigating")}
              className="flex-1"
              disabled={isProcessing}
            >
              Investigating
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleResolve("invalid")}
              className="flex-1"
              disabled={isProcessing}
            >
              Invalid
            </Button>
            <Button
              onClick={() => handleResolve("resolved")}
              className="flex-1"
              disabled={isProcessing}
            >
              Resolve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
