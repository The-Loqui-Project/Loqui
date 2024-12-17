"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getCookie, hasCookie } from "cookies-next/client";

interface UserInfo {
  username: string;
  avatar_url: string;
}

export default function Navbar() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = getCookie("token");
      const tokenExpiration = getCookie("token_expiration");
      const cachedUserInfo = getCookie("cached_user_information");

      if (token && tokenExpiration && cachedUserInfo) {
        const expirationDate = new Date(tokenExpiration as string);
        console.log(expirationDate);
        if (expirationDate > new Date()) {
          try {
            const userInfo = JSON.parse(cachedUserInfo as string);
            setUserInfo({
              username: userInfo.username,
              avatar_url: userInfo.avatar_url,
            });
          } catch (error) {
            console.error("Error parsing user info:", error);
          }
        }
      }
    };

    checkAuth();
  }, []);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              Home
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/projects"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                Projects
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
              >
                About
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {userInfo ? (
              <Link href="/settings" className="flex items-center space-x-2">
                <Image
                  src={userInfo.avatar_url}
                  alt={`${userInfo.username}'s avatar`}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">
                  {userInfo.username}
                </span>
              </Link>
            ) : (
              <a
                href="/auth"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Login to Modrinth
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
