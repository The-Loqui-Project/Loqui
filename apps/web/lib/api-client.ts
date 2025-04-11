// API client functions for interacting with the Loqui API

export interface Project {
  id: string;
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
    id: string;
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
  projectId: string,
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
    (lang) => lang !== "en_us" && progress[lang]?.translated > 0,
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
  const languages = Object.keys(progress);
  const firstLang = languages[0];

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
