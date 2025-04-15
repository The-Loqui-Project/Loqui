// WebSocket client for task management
import { EventEmitter } from "events";

export interface Task {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number; // 0-100
  description: string;
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

// Events emitted by the WebSocket client
type TaskEvents = {
  connected: () => void;
  disconnected: (reason?: string) => void;
  taskUpdate: (task: Task) => void;
  error: (error: Error) => void;
};

// Declare the EventEmitter interface with our custom events
interface TaskEventEmitter {
  on<E extends keyof TaskEvents>(event: E, listener: TaskEvents[E]): this;
  off<E extends keyof TaskEvents>(event: E, listener: TaskEvents[E]): this;
  emit<E extends keyof TaskEvents>(
    event: E,
    ...args: Parameters<TaskEvents[E]>
  ): boolean;
}

class TaskWebSocketClient extends EventEmitter implements TaskEventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private subscribedTasks = new Set<string>();
  private connected = false;
  private reconnectInterval = 1000; // Start with 1 second, will increase with backoff
  private baseUrl: string;

  constructor(baseUrl?: string) {
    super();
    this.baseUrl =
      baseUrl ||
      (process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL.replace(/^http/, "ws")}ws/tasks`
        : typeof window !== "undefined"
          ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/tasks`
          : "ws://localhost:8080/ws/tasks");
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (typeof window === "undefined") return; // Skip on server-side

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      return; // Already connecting or connected
    }

    try {
      this.ws = new WebSocket(this.baseUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      this.emit(
        "error",
        error instanceof Error ? error : new Error(String(error)),
      );
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Subscribe to updates for a specific task
   */
  public subscribeToTask(taskId: string): void {
    if (!taskId) return;

    this.subscribedTasks.add(taskId);

    if (this.connected && this.ws) {
      this.ws.send(
        JSON.stringify({
          type: "subscribe",
          taskId,
        }),
      );
    }
  }

  /**
   * Unsubscribe from updates for a specific task
   */
  public unsubscribeFromTask(taskId: string): void {
    if (!taskId) return;

    this.subscribedTasks.delete(taskId);

    if (this.connected && this.ws) {
      this.ws.send(
        JSON.stringify({
          type: "unsubscribe",
          taskId,
        }),
      );
    }
  }

  /**
   * Resubscribe to all previously subscribed tasks
   * Useful after reconnecting
   */
  private resubscribeToTasks(): void {
    if (!this.connected || !this.ws) return;

    this.subscribedTasks.forEach((taskId) => {
      this.ws!.send(
        JSON.stringify({
          type: "subscribe",
          taskId,
        }),
      );
    });
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.connected = true;
    this.reconnectAttempts = 0;
    this.reconnectInterval = 1000; // Reset reconnect interval
    this.emit("connected");

    // Resubscribe to all tasks
    this.resubscribeToTasks();
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.connected = false;
    this.emit("disconnected", event.reason);

    // Only attempt to reconnect if not closed cleanly
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    this.emit("error", new Error("WebSocket error occurred"));

    // The socket will also trigger a close event
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "taskUpdate" && data.task) {
        // Convert date strings to Date objects
        const task: Task = {
          ...data.task,
          startTime: new Date(data.task.startTime),
          endTime: data.task.endTime ? new Date(data.task.endTime) : undefined,
        };

        this.emit("taskUpdate", task);
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      // Exponential backoff with jitter
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
      const timeout = this.reconnectInterval * jitter;

      // Double the interval for next time
      this.reconnectInterval = Math.min(this.reconnectInterval * 2, 30000); // Max 30 seconds

      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, timeout);
    }
  }

  /**
   * Check if the client is currently connected
   */
  public isConnected(): boolean {
    return this.connected;
  }
}

// Create a singleton instance
const taskWebSocketClient = new TaskWebSocketClient();

export default taskWebSocketClient;
