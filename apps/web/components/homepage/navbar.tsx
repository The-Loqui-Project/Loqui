"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Menu, X, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import LoquiIcon from "@/components/loqui-icon";
import { useAuth } from "@/contexts/auth-context";

interface NavbarProps {
  isAuthenticated?: boolean;
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, user, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <LoquiIcon className="h-6 w-6 text-primary-500" />
            <span className="text-xl font-bold">Loqui</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
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
