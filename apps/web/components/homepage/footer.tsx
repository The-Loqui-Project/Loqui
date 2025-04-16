import type React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookText,
  CircleDot,
  Copyright,
  FileLock2,
  Github,
  MessageSquare,
  Shield,
  Users,
  Wrench,
} from "lucide-react";
import LoquiIcon from "@/components/loqui-icon";
import { meta } from "@repo/meta/meta";

export function Footer() {
  return (
    <footer className="border-t relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background dark:to-emerald-900/20 to-emerald-50 z-0"></div>

      <div className="container relative z-10 py-12">
        <div className="flex flex-col gap-10">
          {/* Logo + Copyright */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 pb-8 border-b border-border/40">
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-2.5 group">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <LoquiIcon className="h-7 w-7 relative" />
                </div>
                <span className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                  The Loqui Project
                </span>
              </div>

              <div className="flex flex-col items-center md:items-start">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} The Loqui Project. GNU General
                  Public License Version 3
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {meta.branch && meta.commit
                    ? `Build: ${meta.branch}@${(meta.commit as string).substring(0, 7)}`
                    : "Local Development build"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 mx-auto">
            {/* Column 1: Links */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold relative inline-block">
                <span className="relative z-10">Links</span>
                <span className="absolute bottom-0 left-0 h-1 w-8 bg-primary/30 rounded-full"></span>
              </h3>
              <div className="flex flex-col gap-3">
                <FooterLink
                  href="https://github.com/The-Loqui-Project"
                  icon={<Github className="h-4 w-4" />}
                  label="GitHub"
                  external
                />
                <FooterLink
                  href="https://modrinth.com/organization/loqui"
                  icon={<Wrench className="h-4 w-4" />}
                  label="Modrinth"
                  external
                />
                <FooterLink
                  href="https://discord.imb11.dev"
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="Discord"
                  external
                />
              </div>
            </div>

            {/* Column 2: Legal */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold relative inline-block">
                <span className="relative z-10">Legal</span>
                <span className="absolute bottom-0 left-0 h-1 w-8 bg-primary/30 rounded-full"></span>
              </h3>
              <div className="flex flex-col gap-3">
                <FooterLink
                  href="/legal/privacy-policy"
                  icon={<FileLock2 className="h-4 w-4" />}
                  label="Privacy Policy"
                />
                <FooterLink
                  href="/legal/terms-of-service"
                  icon={<Shield className="h-4 w-4" />}
                  label="Terms of Service"
                />
                <FooterLink
                  href="https://github.com/The-Loqui-Project/Loqui#License-1-ov-file"
                  icon={<Copyright className="h-4 w-4" />}
                  label="License (GPL v3)"
                  external
                />
              </div>
            </div>

            {/* Column 3: Resources */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold relative inline-block">
                <span className="relative z-10">Resources</span>
                <span className="absolute bottom-0 left-0 h-1 w-8 bg-primary/30 rounded-full"></span>
              </h3>
              <div className="flex flex-col gap-3">
                <FooterLink
                  href="/docs"
                  icon={<BookText className="h-4 w-4" />}
                  label="Documentation"
                />
                <FooterLink
                  href="https://github.com/The-Loqui-Project/loqui/issues"
                  icon={<CircleDot className="h-4 w-4" />}
                  label="Issue Tracker"
                  external
                />
                <FooterLink
                  href="https://github.com/The-Loqui-Project/loqui/contributors"
                  icon={<Users className="h-4 w-4" />}
                  label="Contributors"
                  external
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="px-4 py-2 rounded-lg bg-background/30 backdrop-blur supports-[backdrop-filter]:bg-background/30">
              <p className="text-xs text-muted-foreground/90 max-w-screen-md text-center">
                NOT AN OFFICIAL MINECRAFT PRODUCT/SERVICE/EVENT. NOT APPROVED BY
                OR ASSOCIATED WITH MOJANG OR MICROSOFT
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  icon,
  label,
  external = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      aria-label={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      <div className="flex items-center justify-center h-6 w-6">{icon}</div>
      <span>{label}</span>
      <ArrowUpRight className="h-4 w-4 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
    </Link>
  );
}
