import APIRoute from "../../route";
import taskManager from "../../../util/task-manager";

export default {
  type: "GET",
  route: "/tasks/:id",
  schema: {
    description: "Get a task by its ID",
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          task: {
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
      404: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  func: async (request, response) => {
    const { id } = request.params as { id: string };
    const task = taskManager.getTask(id);

    if (!task) {
      response.status(404).send({
        message: `Task with ID ${id} not found`,
      });
      return;
    }

    response.status(200).send({
      task,
    });
  },
} as APIRoute;
