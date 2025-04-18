"use client";

import { toast } from "@/hooks/use-toast";

// Generic wrapper that adds toast notifications for API errors
export function withErrorToast<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>) => {
    try {
      return await apiFunction(...args);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "API Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };
}
