"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();

  const [authStatus, setAuthStatus] = useState<
    "initial" | "loading" | "success" | "error"
  >("initial");
  const code = searchParams.get("code");
  // Add a ref to track if we've already processed the code
  const codeProcessed = useRef(false);

  async function setupModrinthAuth() {
    try {
      setAuthStatus("loading");
      console.log(process.env.NEXT_PUBLIC_API_URL! + "v1/oauth/configuration");
      const oauthConfiguration = await fetch(
        process.env.NEXT_PUBLIC_API_URL! + "v1/oauth/configuration",
      );
      const data = await oauthConfiguration.json();
      const MODRINTH_URL = `https://modrinth.com/auth/authorize?client_id=${data.client_id}&redirect_uri=${process.env.NEXT_PUBLIC_CURRENT_URL! + "auth"}&scope=${data.scopes}`;

      router.push(MODRINTH_URL);
    } catch (error) {
      console.error("Error setting up Modrinth auth:", error);
      setAuthStatus("error");
    }
  }

  async function finalizeModrinthAuth() {
    try {
      setAuthStatus("loading");
      const oauthFinalize = await fetch(
        process.env.NEXT_PUBLIC_API_URL! + "v1/oauth/finalize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: code,
            redirect_uri_used: process.env.NEXT_PUBLIC_CURRENT_URL! + "auth",
          }),
        },
      );

      const {
        token,
        expiration,
        modrinthResponse,
      }: {
        token: string;
        expiration: number;
        modrinthResponse: Record<string, unknown>;
      } = await oauthFinalize.json();

      // Use the login function from useAuth
      login(token, expiration, modrinthResponse);
      setAuthStatus("success");

      // Wait briefly to ensure the auth state is updated before redirecting
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      console.error("Error finalizing Modrinth auth:", error);
      setAuthStatus("error");
    }
  }

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated && user) {
      setTimeout(() => {
        router.push("/");
      }, 1000);
      return;
    }

    // If we have a code but haven't processed it yet
    if (code && !codeProcessed.current) {
      codeProcessed.current = true; // Mark as processed to prevent duplicate calls
      finalizeModrinthAuth();
    }
    // If no code and not already authenticating, start auth flow
    else if (!code && authStatus === "initial") {
      setupModrinthAuth();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, authStatus]);

  return (
    <div className="flex-1 container py-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {authStatus === "success"
              ? `Hello ${user?.username}!`
              : "Authenticating with Modrinth"}
          </CardTitle>
          <CardDescription className="text-center">
            {authStatus === "success" ? (
              <>Redirecting you to the dashboard...</>
            ) : authStatus === "error" ? (
              <>There was an error authenticating. Please try again.</>
            ) : (
              <>
                {code
                  ? "Please wait while we authenticate you..."
                  : "We're about to send you to Modrinth, hold tight!"}
              </>
            )}
          </CardDescription>
        </CardHeader>
        {authStatus === "error" && (
          <CardContent className="flex justify-center">
            <Button onClick={() => setupModrinthAuth()}>Try Again</Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
