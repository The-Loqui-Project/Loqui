import { useState } from "react";
import { Loader2, Flag } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCookie } from "cookies-next";
import { reportProject } from "@/lib/api-client-wrapper";
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

interface ProjectReportModalProps {
  projectId: string | number;
  projectTitle: string;
  projectSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Predefined report reasons for projects
const REPORT_REASONS = [
  {
    id: "offensive",
    label: "The project contains offensive content",
    priority: "high",
  },
  {
    id: "explicit",
    label: "The project contains sexually explicit content",
    priority: "high",
  },
  {
    id: "inappropriate",
    label: "The project is inappropriate for translation",
    priority: "medium",
  },
  {
    id: "spam",
    label: "The project appears to be spam or misleading",
    priority: "medium",
  },
  {
    id: "copyright",
    label: "The project violates copyright or terms of service",
    priority: "medium",
  },
  {
    id: "other",
    label: "Other issue (please explain)",
    priority: "medium",
  },
] as const;

type ReportReasonId = (typeof REPORT_REASONS)[number]["id"];

export default function ProjectReportModal({
  projectId,
  projectTitle,
  projectSlug,
  open,
  onOpenChange,
}: ProjectReportModalProps) {
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
        description: "Please select a reason for reporting this project",
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
        description: "Please sign in to report projects",
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

      // Use the API wrapper function to report the project
      const response = await reportProject(
        projectId.toString(),
        reasonText,
        token.toString(),
        selectedReason.priority,
      );

      toast({
        title: "Report Submitted",
        description: `Thank you for reporting this project. Our moderators will review it. (Report #${response.reportId})`,
      });

      onOpenChange(false);
      setSelectedReasonId("");
      setAdditionalDetails("");
    } catch (error) {
      console.error("Error reporting project:", error);
      // Error is already handled by the withErrorToast wrapper
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Project</DialogTitle>
          <DialogDescription>
            Report inappropriate or problematic projects to help maintain
            quality. Our moderators will review your report.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-xs font-medium mb-1">Project:</div>
            <div className="text-sm font-medium">{projectTitle}</div>
            <div className="mt-2 text-xs font-medium">Slug:</div>
            <div className="text-xs font-mono text-muted-foreground">
              {projectSlug}
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
                  ? "Please explain why this project should be reviewed..."
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
