"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getProjectProgress,
  getProjectStrings,
  getLanguages,
  getProjectDetails,
  type Language,
  type StringItem,
  type TranslationProgress,
} from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProjectStringsList from "@/components/projects/project-strings-list";
import ProjectInfoSidebar from "@/components/projects/project-info-sidebar";
import LanguageSearch from "@/components/projects/language-search";

export default function ProjectPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<TranslationProgress>({});
  const [languages, setLanguages] = useState<Language[]>([]);
  const [strings, setStrings] = useState<StringItem[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [view, setView] = useState<"languages" | "strings">("languages");
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const router = useRouter();

  const projectId = params.id as string;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [progressData, languagesData, projectData] = await Promise.all([
          getProjectProgress(projectId),
          getLanguages(),
          getProjectDetails(projectId),
        ]);

        setProgress(progressData);
        setLanguages(languagesData);
        setProjectInfo(projectData);

        // Default to English (en_us) if available, otherwise first language
        const defaultLanguage =
          languagesData.find((lang) => lang.code === "en_us")?.code ||
          (languagesData.length > 0 ? languagesData[0]!.code : null);
        setSelectedLanguage(defaultLanguage);
      } catch (err) {
        console.error("Error fetching project data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load project data",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectId]);

  const loadStrings = async (languageCode: string) => {
    try {
      setLoading(true);
      setSelectedLanguage(languageCode);
      const stringsData = await getProjectStrings(projectId);
      setStrings(stringsData);
      setView("strings");
    } catch (err) {
      console.error("Error fetching project strings:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load project strings",
      );
    } finally {
      setLoading(false);
    }
  };

  const backToLanguages = () => {
    setView("languages");
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button className="mt-4" onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ProjectInfoSidebar projectInfo={projectInfo} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {view === "languages" ? (
            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
                <CardDescription>
                  Select a language to view and edit translations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LanguageSearch
                  languages={languages}
                  progress={progress}
                  onSelectLanguage={loadStrings}
                />
              </CardContent>
            </Card>
          ) : (
            <ProjectStringsList
              projectId={projectId}
              strings={strings}
              selectedLanguage={selectedLanguage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
