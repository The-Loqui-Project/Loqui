import type React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function ServiceLink({
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
