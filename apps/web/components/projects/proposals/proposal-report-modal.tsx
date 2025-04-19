import { useState } from "react";
import { Loader2, Flag, AlertTriangle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCookie } from "cookies-next";
import { reportProposal } from "@/lib/api-client-wrapper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProposalReportModalProps {
  proposalId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Predefined report reasons with associated priorities
const REPORT_REASONS = [
  {
    id: "inaccurate",
    label: "The proposed translation is inaccurate",
    priority: "low",
    isReportable: false,
  },
  {
    id: "misleading",
    label: "The proposed translation is misleading",
    priority: "medium",
    isReportable: false,
  },
  {
    id: "poor_style_grammar",
    label: "The translation has poor style or grammar",
    priority: "low",
    isReportable: false,
  },
  {
    id: "wrong_tone_formality",
    label: "The translation uses wrong tone or formality",
    priority: "low",
    isReportable: false,
  },

  {
    id: "offensive",
    label: "The proposal contains offensive content",
    priority: "high",
    isReportable: true,
  },
  {
    id: "explicit",
    label: "The proposal contains sexually explicit content",
    priority: "high",
    isReportable: true,
  },
  {
    id: "harassment",
    label: "The proposal harasses me or another user",
    priority: "critical",
    isReportable: true,
  },
  {
    id: "spam",
    label: "The proposal is spam or misleading",
    priority: "medium",
    isReportable: true,
  },
  {
    id: "other",
    label: "Other issue (please explain)",
    priority: "medium",
    isReportable: true,
  },
] as const;

type ReportReasonId = (typeof REPORT_REASONS)[number]["id"];

export default function ProposalReportModal({
  proposalId,
  open,
  onOpenChange,
}: ProposalReportModalProps) {
  const { toast } = useToast();
  const [selectedReasonId, setSelectedReasonId] = useState<ReportReasonId | "">(
    "",
  );
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const selectedReason = selectedReasonId
    ? REPORT_REASONS.find((reason) => reason.id === selectedReasonId)
    : undefined;

  const isReportable = selectedReason?.isReportable ?? true;

  const handleReportSubmit = async () => {
    if (!selectedReasonId) {
      toast({
        title: "Error",
        description: "Please select a reason for the report",
        variant: "destructive",
      });
      return;
    }

    // If this is a quality issue, close the modal (never submit)
    if (!isReportable) {
      onOpenChange(false);
      return;
    }

    // For "other" reason, require additional details
    if (selectedReasonId === "other" && !additionalDetails.trim()) {
      toast({
        title: "Error",
        description: "Please provide additional details for your report",
        variant: "destructive",
      });
      return;
    }

    const token = await getCookie("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to report proposals",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsReporting(true);

      if (!selectedReason) return;

      // Create the reason text combining the predefined reason with any additional details
      const reasonText =
        selectedReasonId === "other"
          ? additionalDetails
          : additionalDetails.trim()
            ? `${selectedReason.label}. Additional details: ${additionalDetails}`
            : selectedReason.label;

      await reportProposal(
        proposalId,
        reasonText,
        selectedReason.priority,
        token,
      );

      toast({
        title: "Report Submitted",
        description:
          "Thank you for helping to maintain quality. Our moderators will review your report.",
      });

      onOpenChange(false);
      setSelectedReasonId("");
      setAdditionalDetails("");
    } catch (error) {
      console.error("Error reporting proposal:", error);
      // Error is already handled by the withErrorToast wrapper
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Proposal</DialogTitle>
          <DialogDescription>
            Report inappropriate or incorrect translations to help maintain
            quality. Our moderators will review your report.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason for reporting</Label>
            <Select
              value={selectedReasonId}
              onValueChange={(value) =>
                setSelectedReasonId(value as ReportReasonId)
              }
            >
              <SelectTrigger id="report-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReasonId && !isReportable && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Not a reportable issue</AlertTitle>
              <AlertDescription>
                This isn't an issue which should be reported. You should
                downvote the proposal and make a new proposal with how you
                believe the string should be accurately translated.
              </AlertDescription>
            </Alert>
          )}

          {(isReportable || !selectedReasonId) && (
            <div className="space-y-2">
              <Label htmlFor="additional-details">
                {selectedReasonId === "other"
                  ? "Please explain the issue"
                  : "Additional details (optional)"}
              </Label>
              <Textarea
                id="additional-details"
                placeholder={
                  selectedReasonId === "other"
                    ? "Please explain why this proposal should be reviewed..."
                    : "Add any additional context that might help moderators..."
                }
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                className="min-h-24"
                required={selectedReasonId === "other"}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isReportable && (
            <Button onClick={handleReportSubmit} disabled={isReporting}>
              {isReporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          )}
          {!isReportable && selectedReasonId && (
            <Button onClick={() => onOpenChange(false)}>I Understand</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
