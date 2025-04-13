// API client functions for interacting with the Loqui API

export interface Project {
  id: number;
  optIn: string; // date-time
}

export interface UserProject extends Project {
  title: string;
  description: string;
  icon_url: string;
  slug: string;
}

export interface TranslationProgress {
  [language: string]: {
    total: number;
    translated: number;
    progress: number;
  };
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface ProposalItem {
  id: number;
  value: string;
  note?: string;
  status: string;
  score: number;
  approvals: number;
  rank: number;
  language: string;
  user: {
    id: number;
    role: string;
  };
}

export interface StringItem {
  id: number;
  key: string;
  value: string;
  appears_in: string[];
}

const API_BASE_URL = process.env.API_URL || "http://localhost:8080/v1";

/**
 * Get all projects that are currently opted into Loqui
 */
export async function getAllProjects(): Promise<
  {
    title: any;
    description: any;
    slug: any;
    icon_url: any;
    id: number;
    modrinth_data: any;
  }[]
> {
  const response = await fetch(`${API_BASE_URL}v1/projects/all`);

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get projects that belong to the authenticated user
 * @param token Modrinth authentication token
 */
export async function getUserProjects(token: string): Promise<UserProject[]> {
  const response = await fetch(`${API_BASE_URL}v1/projects/user`, {
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user projects: ${response.status}`);
  }

  return await response.json();
}

/**
 * Opt-in one or more projects to Loqui
 * @param projectIds Array of Modrinth project IDs
 * @param token Modrinth authentication token
 */
export async function optInProjects(
  projectIds: string[],
  token: string,
): Promise<{
  status: "success" | "partial";
  message: string;
  failedProjects?: string[];
}> {
  const response = await fetch(`${API_BASE_URL}v1/projects/managment/submit`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(projectIds),
  });

  const data = await response.json();

  if (response.status === 201) {
    return {
      status: "success",
      message: data.message,
    };
  } else if (response.status === 206) {
    return {
      status: "partial",
      message: data.message,
      failedProjects: data.failedProjects || [],
    };
  } else {
    throw new Error(data.message || "Failed to opt-in projects");
  }
}

/**
 * Get translation progress for a project
 * @param projectId The ID of the project
 */
export async function getProjectProgress(
  projectId: number,
): Promise<TranslationProgress> {
  const response = await fetch(
    `${API_BASE_URL}v1/project/${projectId}/progress`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch project progress: ${response.status}`);
  }

  return await response.json();
}

/**
 * Calculate overall progress percentage for a project
 * @param progress The translation progress object
 * @returns A number between 0-100 representing overall translation percentage
 */
export function calculateOverallProgress(
  progress: TranslationProgress,
): number {
  if (!progress || Object.keys(progress).length === 0) return 0;

  // en_us is the source language and doesn't count for progress calculation
  const languages = Object.keys(progress).filter((lang) => lang !== "en_us");

  if (languages.length === 0) return 0;

  let totalProgress = 0;
  languages.forEach((lang) => {
    if (progress[lang] && typeof progress[lang].progress === "number") {
      totalProgress += progress[lang].progress;
    }
  });

  // Return the average progress as a percentage (0-100)
  return Math.round((totalProgress / languages.length) * 100);
}

/**
 * Count the number of languages with at least one translation
 * @param progress The translation progress object
 * @returns The count of languages with some progress
 */
export function countActiveLanguages(progress: TranslationProgress): number {
  if (!progress || Object.keys(progress).length === 0) return 0;

  return Object.keys(progress).filter(
    (lang) => lang !== "en_us" && progress[lang]!.translated > 0,
  ).length;
}

/**
 * Get the total number of strings for a project
 * @param progress The translation progress object
 * @returns The total number of translatable strings
 */
export function getTotalStrings(progress: TranslationProgress): number {
  if (!progress || Object.keys(progress).length === 0) return 0;

  // All languages have the same total, so we can take it from any language
  const languages: string[] = Object.keys(progress);
  const firstLang: string = languages[0]!;

  return languages.length > 0 && progress[firstLang]
    ? progress[firstLang].total
    : 0;
}

/**
 * Get the number of untranslated strings across all languages
 * @param progress The translation progress object
 * @returns The total number of untranslated strings
 */
export function getUntranslatedStrings(progress: TranslationProgress): number {
  if (!progress || Object.keys(progress).length === 0) return 0;

  const languages = Object.keys(progress).filter((lang) => lang !== "en_us");

  if (languages.length === 0) return 0;

  let totalStrings = 0;
  let translatedStrings = 0;

  languages.forEach((lang) => {
    if (progress[lang]) {
      totalStrings += progress[lang].total || 0;
      translatedStrings += progress[lang].translated || 0;
    }
  });

  return totalStrings - translatedStrings;
}

/**
 * Get all available languages
 */
export async function getLanguages(): Promise<Language[]> {
  const response = await fetch(`${API_BASE_URL}v1/languages`);

  if (!response.ok) {
    throw new Error(`Failed to fetch languages: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get strings from a project
 * @param projectId ID of the project
 */
export async function getProjectStrings(
  projectId: number,
): Promise<StringItem[]> {
  const response = await fetch(
    `${API_BASE_URL}v1/project/${projectId}/strings`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch project strings: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get details for a specific string
 * @param projectId ID of the project
 * @param stringId ID of the string
 */
export async function getStringDetails(
  projectId: number,
  stringId: number,
): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}v1/project/${projectId}/string/${stringId}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch string details: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get proposals for a string
 * @param stringId ID of the string
 * @param languageCode Optional language code to filter proposals by
 */
export async function getStringProposals(
  stringId: number,
  languageCode?: string,
): Promise<{
  original: { Id: number; key: string; value: string };
  proposals: ProposalItem[];
}> {
  const url = languageCode
    ? `${API_BASE_URL}v1/string/${stringId}/proposals?language=${languageCode}`
    : `${API_BASE_URL}v1/string/${stringId}/proposals`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch string proposals: ${response.status}`);
  }

  return await response.json();
}

/**
 * Create a new proposal
 * @param translationId ID of the translation
 * @param value Proposed translation value
 * @param note Optional note about the proposal
 * @param token Modrinth authentication token
 */
export async function createProposal(
  translationId: number,
  value: string,
  note: string | undefined,
  token: string,
): Promise<{ id: number; message: string }> {
  const response = await fetch(`${API_BASE_URL}v1/proposals/create`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      translationId,
      value,
      ...(note ? { note } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to create proposal: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Edit a proposal
 * @param proposalId ID of the proposal
 * @param value New proposal value
 * @param note Optional new note
 * @param token Modrinth authentication token
 */
export async function editProposal(
  proposalId: number,
  value: string,
  note: string | undefined,
  token: string,
): Promise<{
  message: string;
  proposal: { id: number; value: string; note?: string };
}> {
  const response = await fetch(
    `${API_BASE_URL}v1/proposals/${proposalId}/edit`,
    {
      method: "PUT",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value,
        ...(note ? { note } : {}),
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to edit proposal: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Vote on a proposal
 * @param proposalId ID of the proposal
 * @param voteType Type of vote ('up', 'down', or 'none')
 * @param token Modrinth authentication token
 */
export async function voteOnProposal(
  proposalId: number,
  voteType: "up" | "down" | "none",
  token: string,
): Promise<{ message: string; newScore: number }> {
  const response = await fetch(
    `${API_BASE_URL}v1/proposals/${proposalId}/vote`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ voteType }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to vote on proposal: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Delete a proposal (moderator+ only)
 * @param proposalId ID of the proposal to delete
 * @param token Modrinth authentication token
 */
export async function deleteProposal(
  proposalId: number,
  token: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}v1/proposals/${proposalId}`, {
    method: "DELETE",
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to delete proposal: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Create a new translation record
 * @param itemId ID of the string
 * @param languageCode Language code
 * @param token Modrinth authentication token
 */
export async function createTranslation(
  itemId: number,
  languageCode: string,
  token: string,
): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE_URL}v1/translations/create`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      itemId,
      languageCode,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to create translation: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Get project details from Modrinth API
 * @param projectId ID or slug of the project
 */
export async function getProjectDetails(projectId: number): Promise<unknown> {
  const response = await fetch(
    `https://api.modrinth.com/v2/project/${projectId}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch project details: ${response.status}`);
  }

  return await response.json();
}
