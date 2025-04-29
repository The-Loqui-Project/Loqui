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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/v1";

/**
 * Get the current authenticated user's information
 * @param token Modrinth authentication token
 */
export async function getCurrentUser(token: string): Promise<{
  id: string;
  username: string;
  role: string;
  isModerator: boolean;
  isAdmin: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}v1/auth/user`, {
    headers: {
      Authorization: token,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to get user data: ${response.status}`,
    );
  }

  return await response.json();
}

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
  taskIds: string[];
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
    return data;
  } else if (response.status === 206) {
    return data;
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
): Promise<{
  id: number;
  message: string;
}> {
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
): Promise<{
  message: string;
  newScore: number;
}> {
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

/**
 * Get projects from Modrinth that the authenticated user has permission to manage
 * @param token Modrinth authentication token
 */
export async function getUserModrinthProjects(token: string): Promise<{
  projects: Array<{
    id: string;
    title: string;
    description: string;
    icon_url: string | null;
    slug: string;
    project_type: string;
    optedIn: boolean;
  }>;
}> {
  const response = await fetch(
    `${API_BASE_URL}v1/projects/management/user-projects`,
    {
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch user's Modrinth projects: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Get a proposal by ID with its associated string information
 * @param proposalId ID of the proposal to retrieve
 */
export async function getProposal(proposalId: number): Promise<{
  proposal: {
    id: number;
    value: string;
    note?: string;
    status: string;
    score: number;
    translation: {
      id: number;
      languageCode: string;
      item: {
        id: number;
        key: string;
        value: string;
      };
    };
    user: {
      id: string;
      role: string;
    };
  };
}> {
  const response = await fetch(`${API_BASE_URL}v1/proposals/${proposalId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch proposal: ${response.status}`);
  }

  return await response.json();
}

/**
 * Report a proposal as inappropriate or incorrect
 * @param proposalId ID of the proposal to report
 * @param reason Reason for reporting the proposal
 * @param priority Priority level of the report (default: medium)
 * @param token Modrinth authentication token
 */
export async function reportProposal(
  proposalId: number,
  reason: string,
  priority: "low" | "medium" | "high" | "critical" = "medium",
  token: string,
): Promise<{ message: string; reportId: number }> {
  const response = await fetch(
    `${API_BASE_URL}v1/proposals/${proposalId}/report`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
        priority,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to report proposal: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Report an original string as inappropriate or offensive
 * @param stringId ID of the string to report
 * @param reason Reason for reporting the string
 * @param priority Priority level of the report (default: medium)
 * @param token Modrinth authentication token
 */
export async function reportString(
  stringId: number,
  reason: string,
  token: string,
  priority: "low" | "medium" | "high" | "critical" = "medium",
): Promise<{ message: string; reportId: number }> {
  const response = await fetch(`${API_BASE_URL}v1/string/${stringId}/report`, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason,
      priority,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to report string: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Report a project as inappropriate or problematic
 * @param projectId ID of the project to report
 * @param reason Reason for reporting the project
 * @param priority Priority level of the report (default: medium)
 * @param token Modrinth authentication token
 */
export async function reportProject(
  projectId: string,
  reason: string,
  token: string,
  priority: "low" | "medium" | "high" | "critical" = "medium",
): Promise<{ message: string; reportId: number }> {
  const response = await fetch(
    `${API_BASE_URL}v1/project/${projectId}/report`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason,
        priority,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to report project: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Get all proposal reports (moderator+ only)
 * @param status Filter by status (default: "open")
 * @param limit Number of reports to return (default: 50)
 * @param offset Pagination offset (default: 0)
 * @param token Modrinth authentication token
 */
export async function getProposalReports(
  token: string,
  status: "open" | "investigating" | "resolved" | "invalid" | "all" = "open",
  limit: number = 50,
  offset: number = 0,
): Promise<{
  reports: Array<{
    id: number;
    priority: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "resolved" | "invalid";
    reason: string;
    createdAt: string;
    resolvedAt?: string;
    proposal: {
      id: number;
      value: string;
      status: string;
    };
    reporter: {
      id: string;
      role: string;
    };
    resolvedBy?: {
      id: string;
      role: string;
    };
  }>;
  total: number;
}> {
  const response = await fetch(
    `${API_BASE_URL}v1/proposals/reports?status=${status}&limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: token,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to fetch proposal reports: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Resolve a proposal report (moderator+ only)
 * @param reportId ID of the report
 * @param status New status
 * @param note Optional resolution note
 * @param token Modrinth authentication token
 */
export async function resolveProposalReport(
  reportId: number,
  status: "resolved" | "invalid" | "investigating",
  note: string | undefined,
  token: string,
): Promise<{
  message: string;
  report: {
    id: number;
    status: string;
    resolvedAt?: string;
    resolvedById?: string;
    resolutionNote?: string;
  };
}> {
  const response = await fetch(
    `${API_BASE_URL}v1/proposals/reports/${reportId}/resolve`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        ...(note ? { note } : {}),
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to resolve report: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Get all string reports (moderator+ only)
 * @param token Modrinth authentication token
 * @param status Filter by status
 */
export async function getStringReports(
  token: string,
  status: "open" | "investigating" | "resolved" | "invalid" | "all" = "open",
): Promise<{
  reports: Array<{
    id: number;
    priority: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "resolved" | "invalid";
    reason: string;
    createdAt: string;
    resolvedAt?: string;
    string: {
      id: number;
      key: string;
      value: string;
    };
    reporter: {
      id: string;
      role: string;
    };
    resolvedBy?: {
      id: string;
      role: string;
    };
  }>;
  total: number;
}> {
  const response = await fetch(
    `${API_BASE_URL}v1/strings/reports?status=${status}`,
    {
      headers: {
        Authorization: token,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to fetch string reports: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Resolve a string report (moderator+ only)
 * @param reportId ID of the report
 * @param status New status
 * @param note Optional resolution note
 * @param token Modrinth authentication token
 */
export async function resolveStringReport(
  reportId: number,
  status: "resolved" | "invalid" | "investigating",
  note: string | undefined,
  token: string,
): Promise<{
  message: string;
  report: {
    id: number;
    status: string;
    resolvedAt?: string;
    resolvedById?: string;
    resolutionNote?: string;
  };
}> {
  const response = await fetch(
    `${API_BASE_URL}v1/strings/reports/${reportId}/resolve`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        ...(note ? { note } : {}),
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to resolve string report: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Get all project reports (moderator+ only)
 * @param token Modrinth authentication token
 * @param status Filter by status
 */
export async function getProjectReports(
  token: string,
  status: "open" | "investigating" | "resolved" | "invalid" | "all" = "open",
): Promise<{
  reports: Array<{
    id: number;
    priority: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "resolved" | "invalid";
    reason: string;
    createdAt: string;
    resolvedAt?: string;
    project: {
      id: string;
      title?: string;
    };
    reporter: {
      id: string;
      role: string;
    };
    resolvedBy?: {
      id: string;
      role: string;
    };
  }>;
  total: number;
}> {
  const response = await fetch(
    `${API_BASE_URL}v1/projects/reports?status=${status}`,
    {
      headers: {
        Authorization: token,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to fetch project reports: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Resolve a project report (moderator+ only)
 * @param reportId ID of the report
 * @param status New status
 * @param note Optional resolution note
 * @param token Modrinth authentication token
 */
export async function resolveProjectReport(
  reportId: number,
  status: "resolved" | "invalid" | "investigating",
  note: string | undefined,
  token: string,
): Promise<{
  message: string;
  report: {
    id: number;
    status: string;
    resolvedAt?: string;
    resolvedById?: string;
    resolutionNote?: string;
  };
}> {
  const response = await fetch(
    `${API_BASE_URL}v1/projects/reports/${reportId}/resolve`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        ...(note ? { note } : {}),
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to resolve project report: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Opt-out a project from Loqui (moderator+ only)
 * @param projectId ID of the project
 * @param token Modrinth authentication token
 */
export async function optOutProject(
  projectId: string,
  token: string,
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_BASE_URL}v1/projects/management/opt-out`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([projectId]),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to opt-out project: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Reset proposal score/votes
 * @param proposalId ID of the proposal
 * @param token Modrinth authentication token
 */
export async function resetProposalVotes(
  proposalId: number,
  token: string,
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_BASE_URL}v1/proposals/${proposalId}/reset-votes`,
    {
      method: "POST",
      headers: {
        Authorization: token,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to reset proposal votes: ${response.status}`,
    );
  }

  return await response.json();
}

/**
 * Get all reports for moderator dashboard (combines proposal, string, and project reports)
 * @param token Modrinth authentication token
 * @param status Filter by status
 */
export async function getAllReports(
  token: string,
  status: "open" | "investigating" | "resolved" | "invalid" | "all" = "open",
): Promise<{
  reports: Array<{
    id: number;
    type: "proposal" | "string" | "project";
    priority: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "resolved" | "invalid";
    reason: string;
    createdAt: string;
    resolvedAt?: string;
    content: {
      id: number | string;
      value?: string;
      key?: string;
      title?: string;
      status?: string;
    };
    reporter: {
      id: string;
      role: string;
    };
    resolvedBy?: {
      id: string;
      role: string;
    };
  }>;
  total: {
    proposal: number;
    string: number;
    project: number;
    all: number;
  };
}> {
  // Fetch all types of reports
  const [proposalReports, stringReports, projectReports] = await Promise.all([
    getProposalReports(token, status).catch(() => ({ reports: [], total: 0 })),
    getStringReports(token, status).catch(() => ({ reports: [], total: 0 })),
    getProjectReports(token, status).catch(() => ({ reports: [], total: 0 })),
  ]);

  // Format proposal reports
  const formattedProposalReports = proposalReports.reports.map((report) => ({
    id: report.id,
    type: "proposal" as const,
    priority: report.priority,
    status: report.status,
    reason: report.reason,
    createdAt: report.createdAt,
    resolvedAt: report.resolvedAt,
    content: {
      id: report.proposal.id,
      value: report.proposal.value,
      status: report.proposal.status,
    },
    reporter: report.reporter,
    resolvedBy: report.resolvedBy,
  }));

  // Format string reports
  const formattedStringReports = stringReports.reports.map((report) => ({
    id: report.id,
    type: "string" as const,
    priority: report.priority,
    status: report.status,
    reason: report.reason,
    createdAt: report.createdAt,
    resolvedAt: report.resolvedAt,
    content: {
      id: report.string.id,
      value: report.string.value,
      key: report.string.key,
    },
    reporter: report.reporter,
    resolvedBy: report.resolvedBy,
  }));

  // Format project reports
  const formattedProjectReports = projectReports.reports.map((report) => ({
    id: report.id,
    type: "project" as const,
    priority: report.priority,
    status: report.status,
    reason: report.reason,
    createdAt: report.createdAt,
    resolvedAt: report.resolvedAt,
    content: {
      id: report.project.id,
      title: report.project.title,
    },
    reporter: report.reporter,
    resolvedBy: report.resolvedBy,
  }));

  // Combine all reports and sort by priority and creation date
  const allReports = [
    ...formattedProposalReports,
    ...formattedStringReports,
    ...formattedProjectReports,
  ].sort((a, b) => {
    // Sort by priority first (critical > high > medium > low)
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

    if (priorityDiff !== 0) return priorityDiff;

    // Then sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return {
    reports: allReports,
    total: {
      proposal: proposalReports.total,
      string: stringReports.total,
      project: projectReports.total,
      all: proposalReports.total + stringReports.total + projectReports.total,
    },
  };
}

/**
 * Get a user's reports (combines proposal, string, and project reports).
 * @param token Modrinth authentication token
 * @param status Filter by status
 */
export async function getAllUserReports(
  userId: string,
  token: string,
  status: "open" | "investigating" | "resolved" | "invalid" | "all" = "open",
  limit: number = 50,
  offset: number = 0,
): Promise<{
  reports: Array<{
    id: number;
    type: "proposal" | "string" | "project";
    priority: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "resolved" | "invalid";
    reason: string;
    createdAt: string;
    resolvedAt?: string;
    content: {
      id: number | string;
      value?: string;
      key?: string;
      title?: string;
      status?: string;
    };
    reporter: {
      id: string;
      role: string;
    };
    resolvedBy?: {
      id: string;
      role: string;
    };
  }>;
  total: {
    proposal: number;
    string: number;
    project: number;
    all: number;
  };
}> {
  const response = await fetch(
    `${API_BASE_URL}v1/user/${userId}/reports?status=${status}&limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: token,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Failed to fetch user's reports: ${response.status}`,
    );
  }

  return await response.json();
}
