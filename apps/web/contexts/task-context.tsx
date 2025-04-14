"use client";

import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import taskWebSocketClient, { Task } from "../lib/ws-client";

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
  const taskUpdateHandlerRef = useRef<((task: Task) => void) | null>(null);
  const errorHandlerRef = useRef<((error: Error) => void) | null>(null);
  const connectedHandlerRef = useRef<(() => void) | null>(null);
  const disconnectedHandlerRef = useRef<((reason?: string) => void) | null>(
    null,
  );

  // Set up WebSocket connection and event handlers
  useEffect(() => {
    // Create the event handlers
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

    // Save handlers to refs so we can properly remove listeners
    taskUpdateHandlerRef.current = handleTaskUpdate;
    errorHandlerRef.current = handleError;
    connectedHandlerRef.current = handleConnected;
    disconnectedHandlerRef.current = handleDisconnected;

    // Add event listeners
    taskWebSocketClient.on("taskUpdate", handleTaskUpdate);
    taskWebSocketClient.on("error", handleError);
    taskWebSocketClient.on("connected", handleConnected);
    taskWebSocketClient.on("disconnected", handleDisconnected);

    // Connect to the WebSocket server
    taskWebSocketClient.connect();

    // Cleanup function to run on unmount
    return () => {
      if (taskUpdateHandlerRef.current) {
        taskWebSocketClient.off("taskUpdate", taskUpdateHandlerRef.current);
      }
      if (errorHandlerRef.current) {
        taskWebSocketClient.off("error", errorHandlerRef.current);
      }
      if (connectedHandlerRef.current) {
        taskWebSocketClient.off("connected", connectedHandlerRef.current);
      }
      if (disconnectedHandlerRef.current) {
        taskWebSocketClient.off("disconnected", disconnectedHandlerRef.current);
      }
    };
  }, []);

  // Reconnect if the window becomes focused or connectivity is restored
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !isConnected) {
        taskWebSocketClient.connect();
      }
    };

    const handleOnline = () => {
      if (!isConnected) {
        taskWebSocketClient.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [isConnected]);

  // Subscribe to a task
  const subscribeToTask = useCallback((taskId: string) => {
    taskWebSocketClient.subscribeToTask(taskId);
  }, []);

  // Unsubscribe from a task
  const unsubscribeFromTask = useCallback((taskId: string) => {
    taskWebSocketClient.unsubscribeFromTask(taskId);
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
