"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, CheckCircle, Search, Check } from "lucide-react";
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
import {
  getUserModrinthProjects,
  optInProjects,
} from "@/lib/api-client-wrapper";
import { getCookie } from "cookies-next/client";
import { CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ModrinthProject {
  id: string;
  title: string;
  description: string;
  icon_url: string | null;
  slug: string;
  project_type: string;
  optedIn: boolean;
}

interface OptInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function OptInModal({ open, onOpenChange, onSuccess }: OptInModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [failedProjects, setFailedProjects] = useState<string[]>([]);
  const [projects, setProjects] = useState<ModrinthProject[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch user's Modrinth projects when the modal opens
  useEffect(() => {
    if (open) {
      fetchUserProjects();
    }
  }, [open]);

  const fetchUserProjects = async () => {
    const token = getCookie("token");
    if (!token) {
      setError("You need to be authenticated to manage projects");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await getUserModrinthProjects(token.toString());
      setProjects(response.projects);

      // Clear selected projects
      setSelectedProjects([]);
    } catch (err) {
      console.error("Error fetching user projects:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch your Modrinth projects",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedProjects.length === 0) {
      setError("Please select at least one project");
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

      const result = await optInProjects(selectedProjects, token.toString());

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
    setSelectedProjects([]);
    setError(null);
    setSuccessMessage(null);
    setFailedProjects([]);
    onOpenChange(false);
  };

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Separate projects into opted-in and not opted-in
  const optedInProjects = filteredProjects.filter((project) => project.optedIn);
  const notOptedInProjects = filteredProjects.filter(
    (project) => !project.optedIn,
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Add Projects to Loqui" : "Confirmation"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Select the projects you want to opt-in to Loqui"
              : "Your projects have been submitted"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search projects..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <ScrollArea className="h-[300px] pr-4">
                    {notOptedInProjects.length === 0 &&
                    optedInProjects.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <p className="text-muted-foreground">
                          No projects found. You may not have any projects on
                          Modrinth, or we couldn't fetch them.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {notOptedInProjects.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-3">
                              Available Projects
                            </h3>
                            <div className="space-y-2">
                              {notOptedInProjects.map((project) => (
                                <div
                                  key={project.id}
                                  className={`flex items-start p-2 rounded-md hover:bg-muted cursor-pointer ${
                                    selectedProjects.includes(project.id)
                                      ? "bg-muted"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    toggleProjectSelection(project.id)
                                  }
                                >
                                  <div className="flex-shrink-0">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage
                                        src={project.icon_url || ""}
                                        alt={project.title}
                                      />
                                      <AvatarFallback>
                                        {project.title.substring(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div className="ml-3 flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium">
                                        {project.title}
                                      </p>
                                      {selectedProjects.includes(
                                        project.id,
                                      ) && (
                                        <Check className="h-4 w-4 text-primary" />
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {project.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {project.slug} · {project.project_type}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {optedInProjects.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium mb-3">
                              Already Opted-In Projects
                            </h3>
                            <div className="space-y-2">
                              {optedInProjects.map((project) => (
                                <div
                                  key={project.id}
                                  className="flex items-start p-2 rounded-md bg-secondary/30"
                                >
                                  <div className="flex-shrink-0">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage
                                        src={project.icon_url || ""}
                                        alt={project.title}
                                      />
                                      <AvatarFallback>
                                        {project.title.substring(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div className="ml-3 flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium">
                                        {project.title}
                                      </p>
                                      <Check className="h-4 w-4 text-green-500" />
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {project.description}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {project.slug} · {project.project_type}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                onClick={handleSubmit}
                disabled={isLoading || selectedProjects.length === 0}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Selected Projects
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
                      <div
                        key={id}
                        className="px-2 py-1 rounded bg-destructive/10 text-destructive text-xs"
                      >
                        {id}
                      </div>
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
