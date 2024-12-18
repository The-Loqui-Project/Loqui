import { getCookie } from "cookies-next/client";

export interface UserInfo {
  username: string;
  avatar_url: string;
}

export const getUserInfoFromCookies = () => {
  const token = getCookie("token");
  const tokenExpiration = getCookie("token_expiration");
  const cachedUserInfo = getCookie("cached_user_information");

  if (token && tokenExpiration && cachedUserInfo) {
    const expirationDate = new Date(tokenExpiration as string);
    console.log(expirationDate);
    if (expirationDate > new Date()) {
      try {
        const userInfo = JSON.parse(cachedUserInfo as string);
        return {
          username: userInfo.username,
          avatar_url: userInfo.avatar_url,
        };
      } catch (error) {
        console.error("Error parsing user info:", error);
      }
    }
  }
  return null;
};
