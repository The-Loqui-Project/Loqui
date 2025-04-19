import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { resolveStringReport } from "@/lib/api-client-wrapper";

interface StringReport {
  id: number;
  type: "string";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "invalid";
  reason: string;
  createdAt: string;
  resolvedAt?: string;
  content: {
    id: number;
    value?: string;
    key?: string;
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

interface StringReportActionModalProps {
  report: StringReport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export function StringReportActionModal({
  report,
  open,
  onOpenChange,
  onActionComplete,
}: StringReportActionModalProps) {
  const { toast } = useToast();
  const [resolutionNote, setResolutionNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

      await resolveStringReport(
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
      console.error("Error resolving string report:", error);
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
          <DialogTitle>String Report Action</DialogTitle>
          <DialogDescription>
            Review and resolve the reported string issue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-xs font-medium mb-1">String Value:</div>
            <div className="text-sm">{report.content.value}</div>
            {report.content.key && (
              <>
                <div className="mt-2 text-xs font-medium">String Key:</div>
                <div className="text-sm font-mono text-muted-foreground">
                  {report.content.key}
                </div>
              </>
            )}
            <div className="mt-2 text-xs font-medium">Report Reason:</div>
            <div className="text-sm text-muted-foreground">{report.reason}</div>
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
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => handleResolve("investigating")}
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Investigating"
              )}
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
