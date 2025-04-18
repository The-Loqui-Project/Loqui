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
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApi } from "@/hooks/use-api";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();
  const [authStatus, setAuthStatus] = useState<
    "initial" | "loading" | "success" | "error"
  >("initial");
  const { apiUrl } = useApi();
  const code = searchParams.get("code");
  const codeProcessed = useRef(false);

  async function setupModrinthAuth() {
    if (!apiUrl) return;

    console.log(apiUrl);

    try {
      setAuthStatus("loading");
      const oauthConfiguration = await fetch(`${apiUrl}v1/oauth/configuration`);
      const data = await oauthConfiguration.json();
      const MODRINTH_URL = `https://modrinth.com/auth/authorize?client_id=${data.client_id}&redirect_uri=${window.location.origin}/auth&scope=${data.scopes}`;
      router.push(MODRINTH_URL);
    } catch (error) {
      console.error("Error setting up Modrinth auth:", error);
      setAuthStatus("error");
    }
  }

  async function finalizeModrinthAuth() {
    if (!apiUrl) return;

    try {
      setAuthStatus("loading");
      console.log(apiUrl);
      const oauthFinalize = await fetch(`${apiUrl}v1/oauth/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          redirect_uri_used: `${window.location.origin}/auth`,
        }),
      });

      console.log("OAuth Finalize Response:", await oauthFinalize.json());

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
    if (!apiUrl) return; // wait until apiUrl is available

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
  }, [code, authStatus, apiUrl]);

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
