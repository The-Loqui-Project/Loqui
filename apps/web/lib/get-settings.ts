"use server";

export async function getApiUrl() {
  return global.process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/";
}
