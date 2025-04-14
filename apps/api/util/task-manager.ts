import { EventEmitter } from "events";

export type TaskStatus = "pending" | "running" | "completed" | "failed";

export interface Task {
  id: string;
  status: TaskStatus;
  progress: number; // 0-100
  description: string;
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export interface TaskOptions {
  description: string;
}

class TaskManager extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private taskCounter = 0;

  constructor() {
    super();
  }

  /**
   * Create a new task and track it
   */
  createTask(options: TaskOptions): string {
    const taskId = `task_${Date.now()}_${this.taskCounter++}`;
    const task: Task = {
      id: taskId,
      status: "pending",
      progress: 0,
      description: options.description,
      startTime: new Date(),
    };

    this.tasks.set(taskId, task);
    this.emit("taskCreated", task);
    return taskId;
  }

  /**
   * Execute a task with progress tracking
   */
  async executeTask<T>(
    taskId: string,
    fn: (updateProgress: (progress: number) => void) => Promise<T>,
  ): Promise<T> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    task.status = "running";
    this.emit("taskUpdated", task);

    try {
      const updateProgress = (progress: number) => {
        if (task) {
          task.progress = Math.min(Math.max(progress, 0), 100);
          this.emit("taskUpdated", task);
        }
      };

      const result = await fn(updateProgress);

      task.status = "completed";
      task.progress = 100;
      task.endTime = new Date();
      task.result = result;
      this.emit("taskUpdated", task);
      this.emit("taskCompleted", task);

      return result;
    } catch (error) {
      task.status = "failed";
      task.endTime = new Date();
      task.error = error instanceof Error ? error.message : String(error);
      this.emit("taskUpdated", task);
      this.emit("taskFailed", task);
      throw error;
    }
  }

  /**
   * Run multiple tasks in chunks to prevent overwhelming the system
   */
  async executeBatch<T, R>(
    items: T[],
    taskDescription: string,
    processFn: (
      item: T,
      updateProgress: (progress: number) => void,
    ) => Promise<R>,
    chunkSize = 5,
  ): Promise<R[]> {
    const taskId = this.createTask({ description: taskDescription });

    return this.executeTask(taskId, async (updateProgress) => {
      const results: R[] = [];
      const totalItems = items.length;
      let processedItems = 0;

      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(
          chunk.map(async (item) => {
            try {
              const result = await processFn(
                item,
                () => {}, // Individual items don't update the overall progress
              );
              return result;
            } catch (error) {
              console.error(`Error processing item in batch: ${error}`);
              throw error;
            } finally {
              processedItems++;
              const overallProgress = (processedItems / totalItems) * 100;
              updateProgress(overallProgress);
            }
          }),
        );

        results.push(...chunkResults);
      }

      return results;
    });
  }

  /**
   * Get a task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Cleanup old completed tasks
   * @param maxAgeMinutes Maximum age of completed tasks in minutes before cleanup
   */
  cleanupOldTasks(maxAgeMinutes = 60): void {
    const now = new Date();
    for (const [taskId, task] of this.tasks.entries()) {
      if (
        (task.status === "completed" || task.status === "failed") &&
        task.endTime
      ) {
        const ageInMinutes =
          (now.getTime() - task.endTime.getTime()) / (1000 * 60);
        if (ageInMinutes > maxAgeMinutes) {
          this.tasks.delete(taskId);
        }
      }
    }
  }
}

// Singleton instance
const taskManager = new TaskManager();

// Auto-cleanup every hour
setInterval(
  () => {
    taskManager.cleanupOldTasks(60);
  },
  60 * 60 * 1000,
);

export default taskManager;
