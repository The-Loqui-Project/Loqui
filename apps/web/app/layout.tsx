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
import { Toaster } from "@/components/ui/toaster";
import { getApiUrl } from "@/lib/get-settings";
import { APIProvider } from "@/contexts/api-context";

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const apiUrl = await getApiUrl();

  console.log("API URL:", apiUrl);

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
            <APIProvider apiUrl={apiUrl}>
              <TaskProvider>
                <CountryFlagPolyfill />
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  {children}
                  <Footer />
                </div>
                <Toaster />
              </TaskProvider>
            </APIProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
