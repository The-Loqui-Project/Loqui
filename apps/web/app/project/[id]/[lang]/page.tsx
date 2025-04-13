"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProjectStrings, type StringItem } from "@/lib/api-client-wrapper";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ProjectStringsList from "@/components/projects/project-strings-list";

export default function ProjectLanguagePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strings, setStrings] = useState<StringItem[]>([]);

  const projectId = params.id as unknown as number;
  const languageCode = params.lang as string;

  useEffect(() => {
    async function fetchStrings() {
      try {
        setLoading(true);
        setError(null);

        const stringsData = await getProjectStrings(projectId);
        setStrings(stringsData);
      } catch (err) {
        console.error("Error fetching project strings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load project strings",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchStrings();
  }, [projectId, languageCode]);

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
        <CardContent className="pt-6">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ProjectStringsList
      projectId={projectId}
      strings={strings}
      selectedLanguage={languageCode}
    />
  );
}
