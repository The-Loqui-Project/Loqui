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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useTask } from "@/hooks/use-task";
import { useToast } from "@/hooks/use-toast";
import { ProjectIcon } from "@/components/info/project/project-icon";

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

interface TaskWithProject {
  processed: boolean;
  taskId: string;
  projectId: string;
  projectName: string; // Store the name for better display
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
  const [taskWithProjects, setTaskWithProjects] = useState<TaskWithProject[]>(
    [],
  );
  const { subscribeToTask, unsubscribeFromTask, tasks, isConnected } =
    useTask();
  const { toast } = useToast();

  // Fetch user's Modrinth projects when the modal opens
  useEffect(() => {
    if (open) {
      fetchUserProjects();
    }
  }, [open]);

  // Subscribe to tasks when they're added
  useEffect(() => {
    taskWithProjects.forEach(({ taskId }) => {
      subscribeToTask(taskId);
    });

    // Cleanup subscriptions when component unmounts or when taskWithProjects changes
    return () => {
      taskWithProjects.forEach(({ taskId }) => {
        unsubscribeFromTask(taskId);
      });
    };
  }, [taskWithProjects, subscribeToTask, unsubscribeFromTask]);

  // Monitor tasks for completion and show toast when completed
  useEffect(() => {
    taskWithProjects.forEach(({ taskId, projectName }) => {
      const task = tasks.get(taskId);

      if (task && (task.status === "completed" || task.status === "failed")) {
        // Check if we've already processed this completion
        const isNewCompletion = !taskWithProjects.find(
          (tp) => tp.taskId === taskId && tp.processed,
        );

        if (isNewCompletion) {
          // Only show toast if modal is closed
          if (!open) {
            toast({
              title:
                task.status === "completed"
                  ? `${projectName} has been indexed`
                  : `Failed to index ${projectName}`,
              description:
                task.status === "completed"
                  ? "The project is now ready for translation."
                  : task.error || "An error occurred during processing.",
              variant: task.status === "completed" ? "default" : "destructive",
            });
          }

          // Mark this task as processed to avoid duplicate toasts
          setTaskWithProjects((current) =>
            current.map((tp) =>
              tp.taskId === taskId ? { ...tp, processed: true } : tp,
            ),
          );

          // If a task completes successfully, trigger the onSuccess callback
          // even if the modal is closed
          if (task.status === "completed" && !open) {
            onSuccess?.();
          }
        }
      }
    });
  }, [tasks, taskWithProjects, open, toast, onSuccess]);

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

      // Store task IDs with their associated project names for better UX
      if (result.taskIds && result.taskIds.length > 0) {
        const newTaskWithProjects: TaskWithProject[] = result.taskIds.map(
          (taskId: string, index: number) => {
            // Find the corresponding project in the selected projects, using non-null assertion
            const projectId = selectedProjects[index]!;
            const projectData = projects.find((p) => p.id === projectId);
            return {
              taskId,
              projectId,
              projectName: projectData?.title || projectId,
            } as TaskWithProject;
          },
        );

        setTaskWithProjects(newTaskWithProjects);
      }

      // Move to step 2 (confirmation and progress)
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

    // Only reset the step and form values, keep the task subscriptions active
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
            {step === 1 ? "Add Projects to Loqui" : "Processing Projects"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Select the projects you want to opt-in to Loqui"
              : "Your projects are being processed. You can close this dialog and continue browsing."}
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
                                  <div className="mr-2">
                                    <ProjectIcon
                                      imageUrl={project?.icon_url}
                                      title={project.title}
                                      size="lg"
                                    />
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
                                  <div className="mr-2">
                                    <ProjectIcon
                                      imageUrl={project?.icon_url}
                                      title={project.title}
                                      size="lg"
                                    />
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
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <AlertDescription>{successMessage}</AlertDescription>
                  </div>
                </Alert>
              )}

              {!isConnected && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Connection to task server was lost. Progress updates may not
                    be accurate.
                  </AlertDescription>
                </Alert>
              )}

              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-sm mb-3">
                  Your projects are being processed in the background. You can
                  close this dialog and continue browsing - we'll notify you
                  when processing is complete.
                </p>
              </div>

              {taskWithProjects.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Processing Status:</h3>
                  {taskWithProjects.map(
                    ({ taskId, projectId, projectName }) => {
                      const task = tasks.get(taskId);
                      const projectData = projects.find(
                        (p) => p.id === projectId,
                      );

                      return (
                        <div key={taskId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="mr-2">
                                <ProjectIcon
                                  imageUrl={projectData!.icon_url!}
                                  title={projectName}
                                  size="md"
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {projectName}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {task ? (
                                task.status === "completed" ? (
                                  <span className="text-green-600 flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />{" "}
                                    Complete
                                  </span>
                                ) : task.status === "failed" ? (
                                  <span className="text-red-600 flex items-center">
                                    <AlertCircle className="h-3 w-3 mr-1" />{" "}
                                    Failed
                                  </span>
                                ) : (
                                  `${task.status} ${task.progress ? `(${Math.round(task.progress)}%)` : ""}`
                                )
                              ) : (
                                "Waiting..."
                              )}
                            </div>
                          </div>
                          <Progress
                            value={
                              task
                                ? task.status === "completed"
                                  ? 100
                                  : task.progress
                                : 0
                            }
                            className="h-2"
                          />
                          {task?.status === "failed" && task.error && (
                            <div className="text-xs text-red-600 mt-1">
                              {task.error}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
