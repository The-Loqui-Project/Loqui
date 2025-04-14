import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { TaskProvider } from "@/contexts/task-context";
import { Navbar } from "@/components/homepage/navbar";
import { Footer } from "@/components/homepage/footer";
import { CountryFlagPolyfill } from "@/components/country-flag-polyfill";

// Load Inter font but don't apply it directly to body
// This allows us to include it in our font stack while preserving the Twemoji Country Flags font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["Twemoji Country Flags", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Loqui - Translate Minecraft Mods Together",
  description:
    "A free and open-source platform that makes translating Minecraft mods easy through crowdsourcing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TaskProvider>
              <CountryFlagPolyfill />
              <div className="flex min-h-screen flex-col">
                <Navbar />
                {children}
                <Footer />
              </div>
            </TaskProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
