"use client";

import { useState } from "react";
import { X, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { optInProjects } from "@/lib/api-client";
import { getCookie } from "cookies-next/client";

interface OptInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function OptInModal({ open, onOpenChange, onSuccess }: OptInModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [failedProjects, setFailedProjects] = useState<string[]>([]);

  const handleAddId = () => {
    if (!currentId.trim()) return;

    // Check if ID is already in the list
    if (projectIds.includes(currentId.trim())) {
      setError("This project ID is already in the list");
      return;
    }

    setProjectIds([...projectIds, currentId.trim()]);
    setCurrentId("");
    setError(null);
  };

  const handleRemoveId = (id: string) => {
    setProjectIds(projectIds.filter((projectId) => projectId !== id));
  };

  const handleSubmit = async () => {
    if (projectIds.length === 0) {
      setError("Please add at least one project ID");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setFailedProjects([]);

    try {
      const token = getCookie("token");

      if (!token) {
        setError("You need to be authenticated to opt-in projects");
        setIsLoading(false);
        return;
      }

      const result = await optInProjects(projectIds, token.toString());

      if (result.status === "partial") {
        setFailedProjects(result.failedProjects ?? []);
        setSuccessMessage(result.message);
      } else {
        setSuccessMessage(result.message);
      }

      // Move to step 2 (confirmation)
      setStep(2);
    } catch (err) {
      console.error("Error opting in projects:", err);
      setError(
        err instanceof Error ? err.message : "Failed to opt-in projects",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset the state when closing
    if (step === 2 && successMessage) {
      onSuccess?.();
    }

    setStep(1);
    setProjectIds([]);
    setCurrentId("");
    setError(null);
    setSuccessMessage(null);
    setFailedProjects([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Add Projects to Loqui" : "Confirmation"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Enter the Modrinth project IDs you want to opt-in to Loqui"
              : "Your projects have been submitted"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="project-id">Modrinth Project ID</Label>
                <div className="flex space-x-2">
                  <Input
                    id="project-id"
                    placeholder="Enter project ID"
                    value={currentId}
                    onChange={(e) => setCurrentId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddId();
                      }
                    }}
                  />
                  <Button onClick={handleAddId}>Add</Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label>Project IDs to opt-in:</Label>
                {projectIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-2">
                    No projects added yet
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {projectIds.map((id) => (
                      <Badge key={id} variant="secondary" className="pl-2">
                        {id}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1"
                          onClick={() => handleRemoveId(id)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Projects
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              {successMessage && (
                <Alert
                  variant="default"
                  className="border-green-500 bg-green-50 dark:bg-green-950/20"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {failedProjects.length > 0 && (
                <div>
                  <Label>Failed Projects:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {failedProjects.map((id) => (
                      <Badge
                        key={id}
                        variant="outline"
                        className="border-red-500"
                      >
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
