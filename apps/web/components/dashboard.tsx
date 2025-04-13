/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Code, Languages, Loader2 } from "lucide-react";
import { ProjectCard } from "@/components/homepage/project-card";
import { AddProjectCard } from "@/components/homepage/add-project-card";
import { ActivityItem } from "@/components/homepage/activity-item";
import { OptInModal } from "@/components/projects/opt-in-modal";
import { useAuth } from "@/contexts/auth-context";
import {
  getAllProjects,
  getUserProjects,
  getProjectProgress,
  calculateOverallProgress,
  countActiveLanguages,
  getTotalStrings,
  getUntranslatedStrings,
} from "@/lib/api-client-wrapper";
import { getCookie } from "cookies-next/client";

export function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [projectsToTranslate, setProjectsToTranslate] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optInModalOpen, setOptInModalOpen] = useState(false);

  // Fetch user projects and projects to translate
  useEffect(() => {
    fetchProjects();
  }, [isAuthenticated]);

  async function fetchProjects() {
    setIsLoading(true);
    setError(null);

    try {
      // Get auth token
      const token = getCookie("token");

      if (!token || !isAuthenticated) {
        setError("You need to be authenticated to view your projects");
        setIsLoading(false);
        return;
      }

      // Fetch user's projects
      const userProjectsData = await getUserProjects(token.toString());

      // Fetch progress data for each user project
      const userProjectsWithProgress = await Promise.all(
        userProjectsData.map(async (project) => {
          try {
            let progressData = {};

            try {
              // Try to fetch progress data, but don't fail if it returns empty
              progressData = await getProjectProgress(project.id);
            } catch (progressErr) {
              console.error(
                `Error fetching progress for project ${project.id}:`,
                progressErr,
              );
              // Return empty progress data object instead of failing
              progressData = {};
            }

            return {
              ...project,
              progressData,
              overallProgress: calculateOverallProgress(progressData),
              activeLanguages: countActiveLanguages(progressData),
              totalStrings: getTotalStrings(progressData),
              untranslatedStrings: getUntranslatedStrings(progressData),
            };
          } catch (err) {
            console.error(`Error processing project ${project.id}:`, err);
            return {
              ...project,
              progressData: {},
              overallProgress: 0,
              activeLanguages: 0,
              totalStrings: 0,
              untranslatedStrings: 0,
            };
          }
        }),
      );

      setUserProjects(userProjectsWithProgress);

      // Fetch all public projects
      const allProjectsData = await getAllProjects();

      // Format and fetch progress data for public projects
      const allProjectsWithProgress = await Promise.all(
        allProjectsData.map(async (project) => {
          try {
            let progressData = {};

            try {
              // Try to fetch progress data, but don't fail if it returns empty
              progressData = await getProjectProgress(project.id);
            } catch (progressErr) {
              console.error(
                `Error fetching progress for project ${project.id}:`,
                progressErr,
              );
              // Return empty progress data object instead of failing
              progressData = {};
            }

            return {
              ...project,
              title: project?.title! || "Unknown Project",
              description: project?.description! || "No description available",
              slug: project?.slug! || project.id,
              icon_url: project?.icon_url! || "",
              progressData,
              overallProgress: calculateOverallProgress(progressData),
              activeLanguages: countActiveLanguages(progressData),
              totalStrings: getTotalStrings(progressData),
              untranslatedStrings: getUntranslatedStrings(progressData),
            };
          } catch (err) {
            console.error(`Error processing project ${project.id}:`, err);
            return {
              ...project,
              title: project?.title! || "Unknown Project",
              description: project?.description! || "No description available",
              slug: project?.slug! || project.id,
              icon_url: project?.icon_url! || "",
              progressData: {},
              overallProgress: 0,
              activeLanguages: 0,
              totalStrings: 0,
              untranslatedStrings: 0,
            };
          }
        }),
      );

      setProjectsToTranslate(allProjectsWithProgress);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate time since last update
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays} days ago`;
  };

  // Handle opening the opt-in modal
  const handleOpenOptInModal = () => {
    setOptInModalOpen(true);
  };

  // Handle successful project opt-in
  const handleOptInSuccess = () => {
    // Refresh projects after successful opt-in
    fetchProjects();
  };

  return (
    <main className="flex-1 container py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 border border-destructive text-destructive p-4 rounded mb-6">
          {error}
        </div>
      )}

      <Tabs defaultValue="my-projects" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          <TabsTrigger value="translate">Translate</TabsTrigger>
        </TabsList>

        <TabsContent value="my-projects" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userProjects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  title={project.title}
                  description={`Last updated ${getTimeSince(project.optIn)}`}
                  progress={project.overallProgress}
                  stats={[
                    { label: "Languages", value: project.activeLanguages },
                    { label: "Translators", value: "N/A" },
                  ]}
                  buttonText="View Details"
                  buttonHref={`/projects/${project.slug}`}
                  imageUrl={project.icon_url}
                />
              ))}
              <AddProjectCard onClick={handleOpenOptInModal} />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You don't have any projects yet
              </p>
              <Button onClick={handleOpenOptInModal}>
                Add Your First Project
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="translate" className="mt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-medium">Projects to Translate</h3>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : projectsToTranslate.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projectsToTranslate.map((project) => (
                  <ProjectCard
                    key={project.id}
                    title={project.title}
                    description={project.description}
                    progress={project.overallProgress}
                    stats={[
                      { label: "Strings", value: project.totalStrings },
                      {
                        label: "Untranslated",
                        value: project.untranslatedStrings,
                      },
                    ]}
                    buttonText="Start Translating"
                    buttonHref={`/project/${project.id}`}
                    imageUrl={project.icon_url}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No projects available for translation
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Opt-in Modal */}
      <OptInModal
        open={optInModalOpen}
        onOpenChange={setOptInModalOpen}
        onSuccess={handleOptInSuccess}
      />
    </main>
  );
}
