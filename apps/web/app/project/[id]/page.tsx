"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getProjectProgress,
  getLanguages,
  type Language,
  type TranslationProgress,
} from "@/lib/with-error-toast";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LanguageSearch from "@/components/projects/language-search";

export default function ProjectPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<TranslationProgress>({});
  const [languages, setLanguages] = useState<Language[]>([]);
  const router = useRouter();

  const projectId = params.id as unknown as number;

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
      } catch (err) {
        console.error("Error fetching language data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load language data",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectId]);

  const navigateToLanguage = (languageCode: string) => {
    router.push(`/project/${projectId}/${languageCode}`);
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
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
          onSelectLanguage={navigateToLanguage}
        />
      </CardContent>
    </Card>
  );
}
