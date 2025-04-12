"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProjectProgress,
  getProjectStrings,
  getLanguages,
  Language,
  StringItem,
  TranslationProgress,
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
import LanguageProgressCard from "@/components/projects/language-progress-card";
import ProjectStringsList from "@/components/projects/project-strings-list";

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<TranslationProgress>({});
  const [languages, setLanguages] = useState<Language[]>([]);
  const [strings, setStrings] = useState<StringItem[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [view, setView] = useState<"languages" | "strings">("languages");
  const router = useRouter();

  const projectId = params.id;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [progressData, languagesData] = await Promise.all([
          getProjectProgress(projectId),
          getLanguages(),
        ]);

        setProgress(progressData);
        setLanguages(languagesData);

        // Default to English (en_us) if available, otherwise first language
        const defaultLanguage =
          languagesData.find((lang) => lang.code === "en_us")?.code ||
          (languagesData.length > 0 ? languagesData[0].code : null);
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

  const loadStrings = async () => {
    try {
      setLoading(true);
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
    <div className="container py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{projectId}</h1>
        <p className="text-muted-foreground">Translation Project</p>
      </div>

      {view === "languages" ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {languages
              .filter((lang) => lang.code !== "en_us") // Exclude English source
              .map((language) => (
                <LanguageProgressCard
                  key={language.code}
                  language={language}
                  progress={progress[language.code]}
                  onClick={() => {
                    setSelectedLanguage(language.code);
                    loadStrings();
                  }}
                />
              ))}
          </div>
        </>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <Button variant="outline" onClick={backToLanguages}>
              Back to Languages
            </Button>
            {selectedLanguage && (
              <div>
                Selected Language:{" "}
                <span className="font-medium">
                  {languages.find((l) => l.code === selectedLanguage)?.name ||
                    selectedLanguage}
                </span>
              </div>
            )}
          </div>
          <ProjectStringsList
            projectId={projectId}
            strings={strings}
            selectedLanguage={selectedLanguage}
          />
        </div>
      )}
    </div>
  );
}
