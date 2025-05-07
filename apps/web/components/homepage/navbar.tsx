"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  CircleUserRound,
  Languages,
  Laptop,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import LoquiIcon from "@/components/ui/icons/loqui-icon";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";
import { getCurrentUser } from "@/lib/api-client-wrapper";
import { getCookie } from "cookies-next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "../ui/separator";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userRole, setUserRole] = useState<{
    isModerator: boolean;
    isAdmin: boolean;
  } | null>(null);
  const { logout, user, isAuthenticated } = useAuth();
  const { setTheme, theme } = useTheme();
  const router = useRouter();

  // Navigation items
  const navItems: {
    icon: React.JSX.Element;
    href: string;
    label: string;
    showAlways?: boolean;
    showWhen?: () => boolean | undefined;
    mobileOnly?: boolean | undefined;
  }[] = [
    {
      href: "/translate",
      label: "Translate",
      icon: <Languages className="h-4 w-4" />,
      showAlways: true,
    },
    {
      href: "/moderation",
      label: "Moderation Dashboard",
      icon: <MessageSquareWarning className="h-4 w-4" />,
      showWhen: () => userRole?.isModerator,
    },
  ];

  // User items
  const userItems = [
    {
      href: `/user/${user?.modrinthUserData?.id}`,
      label: "Profile",
      icon: <User className="h-4 w-4" />,
      showWhen: () => !!user?.username,
    },
    {
      href: `/reports`,
      label: "Reports",
      icon: <MessageSquareWarning className="h-4 w-4" />,
      showAlways: true,
    },
    {
      href: "/dashboard/projects",
      label: "Projects",
      icon: <LayoutDashboard className="h-4 w-4" />,
      showAlways: true,
    },
  ];

  const NavigationLinks = ({ isMobile = false }: { isMobile?: boolean }) => {
    const visibleItems = navItems.filter(
      (item) =>
        (item.showAlways || (item.showWhen && item.showWhen())) &&
        (isMobile || !item.mobileOnly),
    );

    return (
      <>
        {visibleItems.map((item, index) => (
          <React.Fragment key={`nav-${index}`}>
            {!isMobile && index > 0 && (
              <div className="h-6 w-px bg-border mx-1 self-center"></div>
            )}
            <Link href={item.href}>
              <Button
                variant="ghost"
                className={`gap-2 ${isMobile ? "w-full justify-start transition-all duration-100" : "h-10 px-4 relative overflow-hidden transition-all duration-100"}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Button>
            </Link>
          </React.Fragment>
        ))}
      </>
    );
  };

  // Shared profile menu items to avoid duplication
  const ProfileMenuItems = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {!isMobile && user?.username && (
        <>
          <div className="px-3 py-2 text-muted-foreground text-sm">
            {user?.username || "Account"}
          </div>
          <DropdownMenuSeparator />
        </>
      )}

      {userItems.map((item, index) => {
        // Check if the item should be shown
        if (
          (item.showAlways || (item.showWhen && item.showWhen())) &&
          (!item.desktopOnly || !isMobile)
        ) {
          if (isMobile) {
            return (
              <Link href={item.href} key={`profile-${index}`}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 transition-all duration-200"
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            );
          } else {
            return (
              <Link href={item.href} key={`profile-${index}`}>
                <DropdownMenuItem className="gap-2 cursor-pointer py-2 transition-all duration-100">
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              </Link>
            );
          }
        }
        return null;
      })}

      {!isMobile && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="gap-2 cursor-pointer py-2 text-destructive focus:text-destructive focus:bg-destructive/15 transition-all duration-200 hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </>
      )}
    </>
  );

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

  // Theme toggle button component
  const ThemeToggle = ({ className = "" }: { className?: string }) =>
    mounted && (
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        aria-label="Toggle theme"
        className={`${className}`}
      >
        <div className="transform transition-transform duration-200 ease-out">
          {theme === "light" && <Sun className="h-4 w-4" />}
          {theme === "dark" && <Moon className="h-4 w-4" />}
          {theme === "system" && <Laptop className="h-4 w-4" />}
        </div>
      </Button>
    );

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <LoquiIcon className="h-6 w-6 text-primary-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
            <span className="text-xl font-bold relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary-500 after:transition-all after:duration-300 group-hover:after:w-full">
              Loqui
            </span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex ml-6">
              <ul className="flex items-center">
                <NavigationLinks />
              </ul>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Theme Toggle and Auth */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />

            {isAuthenticated ? (
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-3 py-2 h-9"
                  >
                    <CircleUserRound className="h-4 w-4" />
                    <ChevronDown
                      className={`h-4 w-4 transition-all duration-300 ease-in-out ${dropdownOpen ? "rotate-180 text-primary-500" : ""}`}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[220px] shadow-lg border"
                >
                  <ProfileMenuItems isMobile={false} />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button size="sm">Login with Modrinth</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden relative overflow-hidden transition-all duration-300 hover:bg-primary-500/10 hover:text-primary-500 after:absolute after:inset-0 after:rounded-full after:border-2 after:border-transparent after:scale-0 hover:after:scale-100 after:transition-all after:duration-300 hover:after:border-primary-500/20"
              >
                <Menu className="h-5 w-5 transition-transform duration-300 hover:rotate-90" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] sm:w-[350px] p-4">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1 mr-3">
                    <Link href="/" className="flex items-center gap-2">
                      <LoquiIcon className="h-6 w-6 text-primary-500" />
                      <span className="text-xl font-bold">Loqui</span>
                    </Link>
                  </div>
                  <div className="h-6 w-px bg-border"></div>
                  <ThemeToggle className="flex-shrink-0" />
                </div>

                {isAuthenticated ? (
                  <div className="flex flex-col gap-4 px-2">
                    {/* User info on mobile */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <CircleUserRound className="h-8 w-8" />
                      <div>
                        <div className="font-medium">
                          {user?.username || "Account"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {userRole?.isAdmin
                            ? "Admin"
                            : userRole?.isModerator
                              ? "Moderator"
                              : "User"}
                        </div>
                      </div>
                    </div>

                    {/* Navigation links */}
                    <div className="flex flex-col gap-1">
                      <NavigationLinks isMobile />

                      {/* Separator between navigation and profile items */}
                      <div className="h-px w-full bg-border my-2"></div>

                      <ProfileMenuItems isMobile />
                    </div>

                    <div className="mt-auto pt-4">
                      <Button
                        onClick={handleLogout}
                        variant="destructive"
                        className="w-full gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 px-2">
                    <Link href="/auth">
                      <Button className="w-full">Login with Modrinth</Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
