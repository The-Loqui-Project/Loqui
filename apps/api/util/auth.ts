import axios from "axios";
import { User } from "typerinth/dist/interfaces/users";

export default async function validateModrinthToken(
  token: string,
): Promise<User | undefined> {
  // https://docs.modrinth.com/api/operations/getuserfromauth/
  try {
    const userData: User = (
      await axios.get("https://api.modrinth.com/v2/user", {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      })
    ).data;

    if (userData.id) {
      return userData;
    }

    return undefined;
  } catch (e) {
    return undefined;
  }
}
