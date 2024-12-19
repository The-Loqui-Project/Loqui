import axios from "axios";
import { ProjectVersion } from "typerinth";

/**
 * Check for any new versions not present in Loqui's database, and extract strings/update existing ones where needed.
 * @param projectID The project in question's ID.
 */
export default async function checkForNewVersions(
  projectID: string,
): Promise<void> {
  // https://docs.modrinth.com/api/operations/getprojectversions/
  const projectVersions: ProjectVersion[] = (
    await axios(`https://api.modrinth.com/v2/project/${projectID}/version`)
  ).data;
}
