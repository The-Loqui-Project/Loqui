"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Menu } from "lucide-react";
import { getUserInfoFromCookies, UserInfo } from "@/lib/auth";

export default function Navbar() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const userInfo = getUserInfoFromCookies();
    if (userInfo) {
      setUserInfo(userInfo);
    }
    setLoaded(true);
  }, []);

  return (
    <nav className="container flex items-center justify-between p-6 mx-auto">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-4">
            <Link
              href="/"
              className="font-medium flex items-center text-sm transition-colors hover:underline"
              prefetch={false}
            >
              Home
            </Link>
            <Link
              href="/projects"
              className="font-medium flex items-center text-sm transition-colors hover:underline"
              prefetch={false}
            >
              Projects
            </Link>
            <Link
              href="/about"
              className="font-medium flex items-center text-sm transition-colors hover:underline"
              prefetch={false}
            >
              About
            </Link>
          </nav>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                className="font-medium flex items-center text-sm transition-colors hover:underline"
                prefetch={false}
              >
                Home
              </Link>
              <Link
                href="/projects"
                className="font-medium flex items-center text-sm transition-colors hover:underline"
                prefetch={false}
              >
                Projects
              </Link>
              <Link
                href="/about"
                className="font-medium flex items-center text-sm transition-colors hover:underline"
                prefetch={false}
              >
                About
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex items-center flex-row gap-4">
          {loaded ? (
            userInfo ? (
              <Link
                href="/profile"
                className="flex flex-row gap-2 align-middle"
              >
                <img
                  src={userInfo.avatar_url}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-sm font-medium text-gray-700 my-auto">
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
            )
          ) : (
            <div className="spinner">Loading...</div>
          )}
        </div>
      </div>
    </nav>
  );
}
