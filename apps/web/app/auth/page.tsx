"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setCookie } from "cookies-next/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [username, setUsername] = useState(null);
  const code = searchParams.get("code");

  async function setupModrinthAuth() {
    const oauthConfiguration = await fetch(
      process.env.API_URL! + "v1/oauth/configuration",
    );
    const data = await oauthConfiguration.json();
    const MODRINTH_URL = `https://modrinth.com/auth/authorize?client_id=${data.client_id}&redirect_uri=${process.env.CURRENT_URL! + "auth"}&scope=${data.scopes}`;

    router.push(MODRINTH_URL);
  }

  async function finalizeModrinthAuth() {
    const oauthFinalize = await fetch(
      process.env.API_URL! + "v1/oauth/finalize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          redirect_uri_used: process.env.CURRENT_URL! + "auth",
        }),
      },
    );

    const {
      token,
      expiration,
      modrinthResponse,
    }: { token: string; expiration: number; modrinthResponse: any } =
      await oauthFinalize.json();

    console.log(modrinthResponse);
    setUsername(modrinthResponse.username);

    setCookie("token", token);
    setCookie("token_expiration", expiration.toString());
  }

  if (!code) {
    setupModrinthAuth();
  } else {
    // Finalize Oauth using code.
    finalizeModrinthAuth();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {username ? `Hello ${username}!` : "Authenticating with Modrinth"}
          </CardTitle>
          <CardDescription className="text-center">
            {username ? (
              <></>
            ) : (
              <>
                {code
                  ? "Please wait whilst we authenticate you..."
                  : "We're about to send you to Modrinth, hold tight!"}
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
