"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Task, TaskWebSocketClient } from "@/lib/ws-client";
import { useApiClient } from "./api-context";
import { useApi } from "@/hooks/use-api";

interface TaskContextType {
  tasks: Map<string, Task>;
  loading: boolean;
  error: Error | null;
  subscribeToTask: (taskId: string) => void;
  unsubscribeFromTask: (taskId: string) => void;
  isConnected: boolean;
}

export const TaskContext = createContext<TaskContextType>({
  tasks: new Map(),
  loading: false,
  error: null,
  subscribeToTask: () => {},
  unsubscribeFromTask: () => {},
  isConnected: false,
});

interface TaskProviderProps {
  children: React.ReactNode;
}

export function TaskProvider({ children }: TaskProviderProps) {
  const [tasks, setTasks] = useState<Map<string, Task>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { apiUrl } = useApi();
  const wsClientRef = useRef<TaskWebSocketClient | null>(null);

  const taskUpdateHandlerRef = useRef<(task: Task) => void>();
  const errorHandlerRef = useRef<(error: Error) => void>();
  const connectedHandlerRef = useRef<() => void>();
  const disconnectedHandlerRef = useRef<(reason?: string) => void>();

  useEffect(() => {
    if (!apiUrl) return;

    const baseApiUrl = new URL(apiUrl);
    const wsUrl = `${baseApiUrl.protocol === "https:" ? "wss" : "ws"}://${baseApiUrl.host}`;
    const wsClient = new TaskWebSocketClient(wsUrl);
    wsClientRef.current = wsClient;

    const handleTaskUpdate = (task: Task) => {
      setTasks((prevTasks) => {
        const newTasks = new Map(prevTasks);
        newTasks.set(task.id, task);
        return newTasks;
      });
    };

    const handleError = (err: Error) => {
      setError(err);
    };

    const handleConnected = () => {
      setIsConnected(true);
      setLoading(false);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    // Save handlers
    taskUpdateHandlerRef.current = handleTaskUpdate;
    errorHandlerRef.current = handleError;
    connectedHandlerRef.current = handleConnected;
    disconnectedHandlerRef.current = handleDisconnected;

    wsClient.on("taskUpdate", handleTaskUpdate);
    wsClient.on("error", handleError);
    wsClient.on("connected", handleConnected);
    wsClient.on("disconnected", handleDisconnected);

    wsClient.connect();

    return () => {
      if (taskUpdateHandlerRef.current)
        wsClient.off("taskUpdate", taskUpdateHandlerRef.current);
      if (errorHandlerRef.current)
        wsClient.off("error", errorHandlerRef.current);
      if (connectedHandlerRef.current)
        wsClient.off("connected", connectedHandlerRef.current);
      if (disconnectedHandlerRef.current)
        wsClient.off("disconnected", disconnectedHandlerRef.current);
    };
  }, [apiUrl]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isConnected) {
        wsClientRef.current?.connect();
      }
    };

    const handleOnline = () => {
      if (!isConnected) {
        wsClientRef.current?.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [isConnected]);

  const subscribeToTask = useCallback((taskId: string) => {
    wsClientRef.current?.subscribeToTask(taskId);
  }, []);

  const unsubscribeFromTask = useCallback((taskId: string) => {
    wsClientRef.current?.unsubscribeFromTask(taskId);
  }, []);

  const value = {
    tasks,
    loading,
    error,
    subscribeToTask,
    unsubscribeFromTask,
    isConnected,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
