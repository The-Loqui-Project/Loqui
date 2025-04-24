"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Loader2,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import ModrinthIcon, {
  ModrinthFullIcon,
} from "@/components/ui/icons/modrinth-icon";
import { ServiceLink } from "@/components/ui/service-link";
import DiscordIcon from "@/components/ui/icons/discord-icon";

type AuthStatus =
  | "initial"
  | "redirecting"
  | "processing"
  | "success"
  | "error";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();

  const [authStatus, setAuthStatus] = useState<AuthStatus>("initial");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const code = searchParams.get("code");
  const codeProcessed = useRef(false);

  async function setupModrinthAuth() {
    try {
      setAuthStatus("redirecting");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}v1/oauth/configuration`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch OAuth configuration");
      }

      const data = await response.json();
      const redirectUri = `${process.env.NEXT_PUBLIC_CURRENT_URL}auth`;

      const modrinthUrl = new URL("https://modrinth.com/auth/authorize");
      modrinthUrl.searchParams.append("client_id", data.client_id);
      modrinthUrl.searchParams.append("redirect_uri", redirectUri);
      modrinthUrl.searchParams.append("scope", data.scopes);

      router.push(modrinthUrl.toString());
    } catch (error) {
      console.error("Error setting up Modrinth auth:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to connect to Modrinth",
      );
      setAuthStatus("error");
    }
  }

  async function finalizeModrinthAuth(authCode: string) {
    try {
      setAuthStatus("processing");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}v1/oauth/finalize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: authCode,
            redirect_uri_used: `${process.env.NEXT_PUBLIC_CURRENT_URL}auth`,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const statusCode = response.status;

        if (statusCode === 401 || statusCode === 403) {
          throw new Error(
            "Authentication failed: Invalid or expired authorization code",
          );
        } else if (statusCode === 429) {
          throw new Error(
            "Too many authentication attempts. Please try again later",
          );
        } else if (statusCode >= 500) {
          throw new Error(
            "Modrinth servers are currently experiencing issues. Please check the status page",
          );
        } else {
          throw new Error(errorData.message || "Authentication failed");
        }
      }

      const { token, expiration, modrinthResponse } = await response.json();

      login(token, expiration, modrinthResponse);
      setAuthStatus("success");

      // Redirect after successful authentication
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error("Error finalizing Modrinth auth:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to complete authentication",
      );
      setAuthStatus("error");
    }
  }

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated && user) {
      router.push("/");
      return;
    }

    // If we have a code but haven't processed it yet
    if (code && !codeProcessed.current) {
      codeProcessed.current = true;
      finalizeModrinthAuth(code);
    }
    // If no code and not already authenticating, start auth flow
    else if (!code && authStatus === "initial") {
      setupModrinthAuth();
    }
  }, [code, authStatus, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex justify-center mb-3 mt-1">
            <ModrinthFullIcon className="h-20 w-20 text-[#1bd96a]" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {authStatus === "success"
              ? `Welcome, ${user?.username}!`
              : "Modrinth Authentication"}
          </CardTitle>
          <CardDescription className="text-center">
            {getStatusDescription(authStatus)}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {authStatus === "initial" ||
          authStatus === "redirecting" ||
          authStatus === "processing" ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-12 w-12 animate-spin mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {authStatus === "initial"
                  ? "Connecting to Modrinth..."
                  : authStatus === "redirecting"
                    ? "Preparing to redirect to Modrinth..."
                    : "Verifying your credentials..."}
              </p>
            </div>
          ) : authStatus === "success" ? (
            <div className="flex flex-col items-center justify-center py-6">
              <CheckCircle2 className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Authentication successful! Redirecting...
              </p>
            </div>
          ) : authStatus === "error" ? (
            <div className="space-y-4">
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>
                  {errorMessage ||
                    "There was a problem authenticating with Modrinth."}
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border border-input p-4">
                <h3 className="font-medium mb-2">Troubleshooting Resources</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <ServiceLink
                      href="https://discord.imb11.dev"
                      icon={<DiscordIcon className="h-4 w-4" />}
                      label="Discord"
                      external
                    />
                  </li>
                  <li>
                    <ServiceLink
                      href="https://status.modrinth.com/"
                      icon={<ModrinthIcon className="h-4 w-4" />}
                      label="Modrinth Status Page"
                      external
                    />
                  </li>
                  <li>
                    <ServiceLink
                      href="https://github.com/The-Loqui-Project/loqui/issues"
                      icon={<CircleDot className="h-4 w-4" />}
                      label="Issue Tracker"
                      external
                    />
                  </li>
                </ul>
              </div>
            </div>
          ) : null}
        </CardContent>

        {authStatus === "error" && (
          <CardFooter>
            <Button
              onClick={() => setupModrinthAuth()}
              className="w-full"
              variant="outline"
            >
              <RotateCcw /> Try Again
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

function getStatusDescription(status: AuthStatus): string {
  switch (status) {
    case "initial":
      return "Connecting to Modrinth...";
    case "redirecting":
      return "You'll be redirected to Modrinth to authorize access";
    case "processing":
      return "Processing your authentication...";
    case "success":
      return "Authentication successful!";
    case "error":
      return "We couldn't complete the authentication process. Please check the resources below or try again.";
    default:
      return "Connecting to Modrinth...";
  }
}
