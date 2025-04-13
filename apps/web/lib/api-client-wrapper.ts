import { toast } from "@/hooks/use-toast";
import * as APIClient from "./api-client";

// Generic wrapper that adds toast notifications for API errors
export function withErrorToast<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>) => {
    try {
      return await apiFunction(...args);
    } catch (error) {
      // Extract error message
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      // Show toast notification
      toast({
        title: "API Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Re-throw the error so calling code can still handle it if needed
      throw error;
    }
  };
}

// Export wrapped versions of all API functions
export const getAllProjects = withErrorToast(APIClient.getAllProjects);
export const getUserProjects = withErrorToast(APIClient.getUserProjects);
export const optInProjects = withErrorToast(APIClient.optInProjects);
export const getProjectProgress = withErrorToast(APIClient.getProjectProgress);
export const getLanguages = withErrorToast(APIClient.getLanguages);
export const getProjectStrings = withErrorToast(APIClient.getProjectStrings);
export const getStringDetails = withErrorToast(APIClient.getStringDetails);
export const getStringProposals = withErrorToast(APIClient.getStringProposals);
export const createProposal = withErrorToast(APIClient.createProposal);
export const editProposal = withErrorToast(APIClient.editProposal);
export const voteOnProposal = withErrorToast(APIClient.voteOnProposal);
export const deleteProposal = withErrorToast(APIClient.deleteProposal);
export const createTranslation = withErrorToast(APIClient.createTranslation);
export const getProjectDetails = withErrorToast(APIClient.getProjectDetails);

// Re-export utility functions that don't make API calls
export const calculateOverallProgress = APIClient.calculateOverallProgress;
export const countActiveLanguages = APIClient.countActiveLanguages;
export const getTotalStrings = APIClient.getTotalStrings;
export const getUntranslatedStrings = APIClient.getUntranslatedStrings;

// Re-export types
export type {
  Project,
  UserProject,
  TranslationProgress,
  Language,
  ProposalItem,
  StringItem,
} from "./api-client";
