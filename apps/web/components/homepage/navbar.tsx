"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Moon, Sun, Laptop } from "lucide-react";
import { useRouter } from "next/navigation";
import LoquiIcon from "@/components/loqui-icon";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "next-themes";

interface NavbarProps {
  isAuthenticated?: boolean;
}

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, user, isAuthenticated } = useAuth();
  const { setTheme, theme } = useTheme();
  const router = useRouter();

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <LoquiIcon className="h-6 w-6 text-primary-500" />
            <span className="text-xl font-bold">Loqui</span>
          </Link>
          {isAuthenticated && (
            <Link href="/dashboard" className="ml-4">
              <Button variant="ghost" size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
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
              <span className="text-sm hidden md:inline-block">
                Hello, {user?.username}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </header>
  );
}
