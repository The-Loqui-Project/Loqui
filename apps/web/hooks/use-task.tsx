"use client";

import { useContext, useEffect } from "react";
import { TaskContext } from "../contexts/task-context";
import { Task } from "../lib/ws-client";

interface UseTaskResult {
  tasks: Map<string, Task>;
  loading: boolean;
  error: Error | null;
  subscribeToTask: (taskId: string) => void;
  unsubscribeFromTask: (taskId: string) => void;
  isConnected: boolean;
  getTask: (taskId: string) => Task | undefined;
  // Add specific task subscription with auto-cleanup on component unmount
  useTaskSubscription: (taskId: string) => Task | undefined;
}

export function useTask(): UseTaskResult {
  const context = useContext(TaskContext);

  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }

  // Helper function to get a specific task by ID
  const getTask = (taskId: string): Task | undefined => {
    return context.tasks.get(taskId);
  };

  // Hook to subscribe to a task with auto-cleanup
  const useTaskSubscription = (taskId: string): Task | undefined => {
    useEffect(() => {
      if (taskId) {
        context.subscribeToTask(taskId);

        // Cleanup on component unmount
        return () => {
          context.unsubscribeFromTask(taskId);
        };
      }
    }, [taskId]);

    return context.tasks.get(taskId);
  };

  return {
    ...context,
    getTask,
    useTaskSubscription,
  };
}
