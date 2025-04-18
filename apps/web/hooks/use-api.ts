"use client";

import { withErrorToast } from "@/lib/with-error-toast";
import { useApiClient } from "@/contexts/api-context";

export function useApi() {
  const api = useApiClient();

  return {
    apiUrl: api.apiUrl,

    getAllProjects: withErrorToast(api.getAllProjects),
    getUserProjects: withErrorToast(api.getUserProjects),
    getUserModrinthProjects: withErrorToast(api.getUserModrinthProjects),
    optInProjects: withErrorToast(api.optInProjects),
    getProjectProgress: withErrorToast(api.getProjectProgress),
    getLanguages: withErrorToast(api.getLanguages),
    getProjectStrings: withErrorToast(api.getProjectStrings),
    getStringDetails: withErrorToast(api.getStringDetails),
    getStringProposals: withErrorToast(api.getStringProposals),
    createProposal: withErrorToast(api.createProposal),
    editProposal: withErrorToast(api.editProposal),
    getProposal: withErrorToast(api.getProposal),
    voteOnProposal: withErrorToast(api.voteOnProposal),
    deleteProposal: withErrorToast(api.deleteProposal),
    createTranslation: withErrorToast(api.createTranslation),
    getProjectDetails: withErrorToast(api.getProjectDetails),

    calculateOverallProgress: api.calculateOverallProgress,
    countActiveLanguages: api.countActiveLanguages,
    getTotalStrings: api.getTotalStrings,
    getUntranslatedStrings: api.getUntranslatedStrings,
  };
}
