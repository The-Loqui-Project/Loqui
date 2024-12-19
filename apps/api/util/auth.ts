import axios from "axios";

export default async function validateModrinthToken(
  token: string,
): Promise<boolean> {
  // https://docs.modrinth.com/api/operations/getuserfromauth/
  try {
    const response = await axios.get("https://api.modrinth.com/v2/user", {
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(response.data);

    return response.data.id != undefined;
  } catch (e) {
    console.log(e);
    return false;
  }
}
