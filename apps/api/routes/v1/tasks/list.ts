import APIRoute from "../../route";
import taskManager from "../../../util/task-manager";

export default {
  type: "GET",
  route: "/tasks",
  schema: {
    description: "Get a list of all active and recent tasks",
    response: {
      200: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                status: { type: "string" },
                progress: { type: "number" },
                description: { type: "string" },
                startTime: { type: "string", format: "date-time" },
                endTime: { type: "string", format: "date-time" },
                error: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  func: async (request, response) => {
    const tasks = taskManager.getAllTasks();

    response.status(200).send({
      tasks,
    });
  },
} as APIRoute;
