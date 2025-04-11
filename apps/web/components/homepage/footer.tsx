import Link from "next/link";
import { Globe } from "lucide-react";
import LoquiIcon from "@/components/loqui-icon";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex items-center gap-2">
          <LoquiIcon className="h-5 w-5 text-primary-500" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} The Loqui Project. GNU General Public
            License Version 3
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/*TODO: Privacy Policy + Terms Of Service*/}
          {/*<Link*/}
          {/*  href="#"*/}
          {/*  className="text-sm text-muted-foreground hover:underline"*/}
          {/*>*/}
          {/*  Privacy Policy*/}
          {/*</Link>*/}
          {/*<Link*/}
          {/*  href="#"*/}
          {/*  className="text-sm text-muted-foreground hover:underline"*/}
          {/*>*/}
          {/*  Terms of Service*/}
          {/*</Link>*/}
          <Link
            href="https://github.com/The-Loqui-Project"
            className="text-sm text-muted-foreground hover:underline"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
