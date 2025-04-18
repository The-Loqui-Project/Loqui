"use client";

import React, { createContext, useContext } from "react";
import { APIv1 } from "@/lib/api-client";

const ApiUrlContext = createContext<string | null>(null);

export function APIProvider({
  apiUrl,
  children,
}: {
  apiUrl: string;
  children: React.ReactNode;
}) {
  return (
    <ApiUrlContext.Provider value={apiUrl}>{children}</ApiUrlContext.Provider>
  );
}

let client: APIv1 | null = null;

export function useApiClient() {
  const apiUrl = useContext(ApiUrlContext);
  if (!apiUrl) {
    throw new Error("API URL not provided");
  }

  if (!client) {
    client = new APIv1(apiUrl);
  }
  return client;
}
