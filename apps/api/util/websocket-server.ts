import { FastifyInstance } from "fastify";
import taskManager, { Task } from "./task-manager";
import fastifyWebsocket from "@fastify/websocket";
import { WebSocket } from "ws";

/**
 * Set up WebSocket server for real-time task status updates
 */
export async function setupWebSocketServer(server: FastifyInstance) {
  // Register the WebSocket plugin
  await server.register(fastifyWebsocket);

  // Define the WebSocket route
  server.get("/ws/tasks", { websocket: true } as any, (connection, req) => {
    const socket: WebSocket = connection;

    // Set up client state
    const clientState = {
      isAlive: true,
      subscribedTasks: new Set<string>(),
    };

    // Set up ping interval for this specific client
    const pingInterval = setInterval(() => {
      if (!clientState.isAlive) {
        clearInterval(pingInterval);
        return socket.close();
      }

      clientState.isAlive = false;
      socket.ping();
    }, 30000);

    // Handle pong responses
    socket.on("pong", () => {
      clientState.isAlive = true;
    });

    // Handle client messages
    socket.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Subscribe to task updates
        if (data.type === "subscribe" && data.taskId) {
          clientState.subscribedTasks.add(data.taskId);

          // Send current task status immediately if available
          const task = taskManager.getTask(data.taskId);
          if (task) {
            socket.send(
              JSON.stringify({
                type: "taskUpdate",
                task,
              }),
            );
          }
        }

        // Unsubscribe from task updates
        if (data.type === "unsubscribe" && data.taskId) {
          clientState.subscribedTasks.delete(data.taskId);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });

    // Handle client disconnect
    socket.on("close", () => {
      clearInterval(pingInterval);
      // No need to clear subscribedTasks as the entire client state will be garbage collected
    });

    // Setup event handlers for task updates
    const taskUpdateHandler = (task: Task) => {
      if (clientState.subscribedTasks.has(task.id)) {
        socket.send(
          JSON.stringify({
            type: "taskUpdate",
            task,
          }),
        );
      }
    };

    // Add task event listeners
    taskManager.on("taskCreated", taskUpdateHandler);
    taskManager.on("taskUpdated", taskUpdateHandler);
    taskManager.on("taskCompleted", taskUpdateHandler);
    taskManager.on("taskFailed", taskUpdateHandler);

    // Remove listeners when client disconnects
    socket.on("close", () => {
      taskManager.off("taskCreated", taskUpdateHandler);
      taskManager.off("taskUpdated", taskUpdateHandler);
      taskManager.off("taskCompleted", taskUpdateHandler);
      taskManager.off("taskFailed", taskUpdateHandler);
    });
  });

  server.log.info("WebSocket server for tasks set up at /ws/tasks");
}
