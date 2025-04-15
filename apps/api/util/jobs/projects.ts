import { eq, isNotNull, ne, not } from "drizzle-orm";
import db from "../../db";
import { project } from "../../db/schema/schema";
import checkForNewVersions, { isProjectValid } from "../modrinth";
import taskManager from "../task-manager";

export async function checkProjectsValid() {
  const taskId = taskManager.createTask({
    description: "Validating all projects",
  });

  // Run the task in the background - don't await the result
  taskManager.executeTask(taskId, async (updateProgress) => {
    const projects = await db
      .select()
      .from(project)
      .where(isNotNull(project.optIn));

    updateProgress(10);

    const results = await taskManager.executeBatch(
      projects,
      "Validating projects batch",
      async (projectVal, updateItemProgress) => {
        const projectVersions = await isProjectValid(projectVal.id);

        if (projectVersions === false) {
          await db
            .update(project)
            .set({ optIn: null })
            .where(eq(project.id, projectVal.id));
          return { id: projectVal.id, valid: false };
        }

        return { id: projectVal.id, valid: true };
      },
      10, // batch size
    );

    return {
      totalProjects: projects.length,
      invalidProjects: results.filter((r) => !r.valid).length,
      results,
    };
  });

  return taskId;
}

export async function checkProjectsForNewVersions() {
  const taskId = taskManager.createTask({
    description: "Checking all projects for new versions",
  });

  // Run the task in the background - don't await the result
  taskManager.executeTask(taskId, async (updateProgress) => {
    const projects = await db
      .select()
      .from(project)
      .where(isNotNull(project.optIn));

    updateProgress(5);

    const taskIds: string[] = [];

    // Process in batches of 5 projects at a time
    const batchSize = 5;
    let processedCount = 0;

    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize);

      const batchTaskIds = await Promise.all(
        batch.map(async (projectVal) => {
          // This returns a task ID that can be tracked
          return checkForNewVersions(projectVal.id);
        }),
      );

      taskIds.push(...batchTaskIds);

      processedCount += batch.length;
      const progress = Math.floor((processedCount / projects.length) * 95) + 5;
      updateProgress(progress);

      // Wait a little between batches to avoid overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    updateProgress(100);

    return {
      totalProjects: projects.length,
      taskIds: taskIds,
    };
  });

  return taskId;
}
