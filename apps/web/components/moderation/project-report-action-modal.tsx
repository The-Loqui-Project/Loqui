"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCookie } from "cookies-next";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { resolveProjectReport, optOutProject } from "@/lib/api-client-wrapper";

export interface ProjectReport {
  id: number;
  type: "project";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "invalid";
  reason: string;
  createdAt: string;
  resolvedAt?: string;
  content: {
    id: string;
    title?: string;
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

interface ProjectReportActionModalProps {
  report: ProjectReport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete: () => void;
}

export function ProjectReportActionModal({
  report,
  open,
  onOpenChange,
  onActionComplete,
}: ProjectReportActionModalProps) {
  const { toast } = useToast();
  const [resolutionNote, setResolutionNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOptingOut, setIsOptingOut] = useState(false);
  const [optOutComplete, setOptOutComplete] = useState(false);

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

      await resolveProjectReport(
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
      console.error("Error resolving project report:", error);
      toast({
        title: "Error",
        description: "Failed to resolve report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptOut = async () => {
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
      setIsOptingOut(true);

      await optOutProject(report.content.id.toString(), token.toString());

      setOptOutComplete(true);
      toast({
        title: "Success",
        description: `Project has been opted out from Loqui`,
      });
    } catch (error) {
      console.error("Error opting out project:", error);
      toast({
        title: "Error",
        description: "Failed to opt out project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOptingOut(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Project Report Action</DialogTitle>
          <DialogDescription>
            Review and resolve the reported project issue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {optOutComplete && (
            <Alert
              variant="default"
              className="bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Project Opted Out</AlertTitle>
              <AlertDescription>
                This project has been successfully opted out from Loqui.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-xs font-medium mb-1">Project:</div>
            <div className="text-sm">
              {report.content.title || report.content.id}
            </div>
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

          <div className="pt-2">
            <Button
              onClick={handleOptOut}
              variant="destructive"
              disabled={isProcessing || isOptingOut || optOutComplete}
              className="w-full"
            >
              {isOptingOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opting Out...
                </>
              ) : optOutComplete ? (
                "Opted Out"
              ) : (
                "Opt-Out Project from Loqui"
              )}
            </Button>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing || isOptingOut}
            >
              Cancel
            </Button>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => handleResolve("investigating")}
              className="flex-1"
              disabled={isProcessing || isOptingOut}
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
              disabled={isProcessing || isOptingOut}
            >
              Invalid
            </Button>
            <Button
              onClick={() => handleResolve("resolved")}
              className="flex-1"
              disabled={isProcessing || isOptingOut}
            >
              Resolve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
