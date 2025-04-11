import { eq, isNotNull, ne, not } from "drizzle-orm";
import db from "../../db";
import { project } from "../../db/schema/schema";
import checkForNewVersions, { isProjectValid } from "../modrinth";

export async function checkProjectsValid() {
  const projects = await db
    .select()
    .from(project)
    .where(isNotNull(project.optIn));
  const batchSize = 10;
  for (let i = 0; i < projects.length; i += batchSize) {
    const batch = projects.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (projectVal) => {
        const projectVersions = await isProjectValid(projectVal.id);

        if (projectVersions === false) {
          await db
            .update(project)
            .set({ optIn: null })
            .where(eq(project.id, projectVal.id));
        }
      }),
    );
  }
}

export async function checkProjectsForNewVersions() {
  const projects = await db
    .select()
    .from(project)
    .where(isNotNull(project.optIn));
  const batchSize = 10;
  for (let i = 0; i < projects.length; i += batchSize) {
    const batch = projects.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (projectVal) => {
        checkForNewVersions(projectVal.id);
      }),
    );
  }
}
