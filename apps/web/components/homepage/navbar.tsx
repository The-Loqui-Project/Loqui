"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LayoutDashboard,
  Moon,
  Sun,
  Laptop,
  Menu,
  MessageSquareWarning,
  ChevronDown,
  User,
  CircleUserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import LoquiIcon from "@/components/ui/icons/loqui-icon";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getCurrentUser } from "@/lib/api-client-wrapper";
import { getCookie } from "cookies-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "../ui/separator";

interface NavbarProps {
  isAuthenticated?: boolean;
}

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<{
    isModerator: boolean;
    isAdmin: boolean;
  } | null>(null);
  const { logout, user, isAuthenticated } = useAuth();
  const { setTheme, theme } = useTheme();
  const router = useRouter();

  // Fetch user role and check permissions
  useEffect(() => {
    if (isAuthenticated) {
      const token = getCookie("token");
      if (!token) {
        return;
      }

      getCurrentUser(token.toString())
        .then((userData) => {
          setUserRole({
            isModerator: userData.isModerator,
            isAdmin: userData.isAdmin,
          });
        })
        .catch((err) => {
          console.error("Error fetching user role:", err);
        });
    }
  }, [isAuthenticated]);

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <LoquiIcon className="h-6 w-6 text-primary-500" />
            <span className="text-xl font-bold">Loqui</span>
          </Link>
          {isAuthenticated && (
            <div className="hidden md:block">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              {userRole?.isModerator && (
                <Link href="/moderation">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageSquareWarning className="h-4 w-4" />
                    <span>Moderation Dashboard</span>
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleTheme}
              aria-label="Toggle theme"
            >
              {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem]" />}
              {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem]" />}
              {theme === "system" && (
                <Laptop className="h-[1.2rem] w-[1.2rem]" />
              )}
            </Button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex flex-row gap-x-1"
                    aria-label="Profile"
                  >
                    <ChevronDown className="h-4 w-4" />
                    <CircleUserRound className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={10}>
                  <Link href={`/user/${user?.modrinthUserData?.id}`}>
                    <DropdownMenuItem>
                      <User className="h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/reports">
                    <DropdownMenuItem>
                      <MessageSquareWarning className="h-4 w-4" />
                      Reports
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link href="/auth">
              <Button size="sm">Login with Modrinth</Button>
            </Link>
          )}
        </div>

        {/* Mobile menu */}
        <div className="flex md:hidden items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleTheme}
              aria-label="Toggle theme"
              className="h-8 w-8"
            >
              {theme === "light" && <Sun className="h-[1.2rem] w-[1.2rem]" />}
              {theme === "dark" && <Moon className="h-[1.2rem] w-[1.2rem]" />}
              {theme === "system" && (
                <Laptop className="h-[1.2rem] w-[1.2rem]" />
              )}
            </Button>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col h-full py-4">
                <div className="px-4 mb-8">
                  <div className="flex items-center gap-2 mb-6">
                    <LoquiIcon className="h-6 w-6 text-primary-500" />
                    <span className="text-xl font-bold">Loqui</span>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 px-4">
                  {isAuthenticated && (
                    <>
                      <Link href="/dashboard" className="w-full">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          <span>Dashboard</span>
                        </Button>
                      </Link>
                      <Separator className="h-8" />
                      <div className="flex flex-row gap-x-2">
                        <CircleUserRound className="h-4 w-4" />
                        <span className="text-sm text-muted-foreground mb-2">
                          {user?.username}
                        </span>
                      </div>
                      <Link href={`/user/${user?.modrinthUserData?.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2"
                        >
                          <User className="h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                      <Link href="/reports" className="w-full">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2"
                        >
                          <MessageSquareWarning className="h-4 w-4" />
                          <span>Reports</span>
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="w-full justify-start gap-2"
                      >
                        <LogOut className="h-4 w-4 text-red-500" />
                        <span>Logout</span>
                      </Button>
                    </>
                  )}
                  {!isAuthenticated && (
                    <Link href="/auth" className="w-full">
                      <Button size="sm" className="w-full">
                        Login with Modrinth
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
