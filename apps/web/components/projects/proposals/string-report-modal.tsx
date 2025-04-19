import { useState } from "react";
import { Loader2, Flag } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCookie } from "cookies-next";
import { reportString } from "@/lib/api-client-wrapper";
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

interface StringReportModalProps {
  stringId: number;
  stringValue: string;
  stringKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Predefined report reasons for source strings
const REPORT_REASONS = [
  {
    id: "offensive",
    label: "The string contains offensive content",
    priority: "high",
    isReportable: true,
  },
  {
    id: "explicit",
    label: "The string contains sexually explicit content",
    priority: "high",
    isReportable: true,
  },
  {
    id: "inappropriate",
    label: "The string is inappropriate for the context",
    priority: "medium",
    isReportable: true,
  },
  {
    id: "harmful",
    label: "The string contains harmful information",
    priority: "high",
    isReportable: true,
  },
  {
    id: "trademark",
    label: "The string violates trademark or copyright",
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

export default function StringReportModal({
  stringId,
  stringValue,
  stringKey,
  open,
  onOpenChange,
}: StringReportModalProps) {
  const { toast } = useToast();
  const [selectedReasonId, setSelectedReasonId] = useState<ReportReasonId | "">(
    "",
  );
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const selectedReason = selectedReasonId
    ? REPORT_REASONS.find((reason) => reason.id === selectedReasonId)
    : undefined;

  const handleReportSubmit = async () => {
    if (!selectedReasonId) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting this string",
        variant: "destructive",
      });
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
        description: "Please sign in to report strings",
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

      // Use the API wrapper function instead of direct fetch
      const response = await reportString(
        stringId,
        reasonText,
        token,
        selectedReason.priority,
      );

      toast({
        title: "Report Submitted",
        description: `Thank you for reporting this string. Our moderators will review it. (Report #${response.reportId})`,
      });

      onOpenChange(false);
      setSelectedReasonId("");
      setAdditionalDetails("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      // Check if this is a duplicate report error
      if (errorMessage.includes("already reported")) {
        toast({
          title: "Already Reported",
          description:
            "You have already reported this string and your report is still pending review.",
          variant: "destructive",
        });

        // Close the modal since they can't submit a new report
        onOpenChange(false);
      } else {
        console.error("Error reporting string:", error);
        // Other errors are already handled by the withErrorToast wrapper
      }
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Source String</DialogTitle>
          <DialogDescription>
            Report inappropriate or problematic source strings to help maintain
            quality. Our moderators will review your report.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-xs font-medium mb-1">String:</div>
            <div className="text-sm">{stringValue}</div>
            <div className="mt-2 text-xs font-medium">Key:</div>
            <div className="text-xs font-mono text-muted-foreground">
              {stringKey}
            </div>
          </div>

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
                  ? "Please explain why this string should be reviewed..."
                  : "Add any additional context that might help moderators..."
              }
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className="min-h-24"
              required={selectedReasonId === "other"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
