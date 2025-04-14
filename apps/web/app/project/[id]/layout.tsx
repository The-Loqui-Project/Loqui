"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProjectDetails } from "@/lib/api-client-wrapper";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProjectInfoSidebar from "@/components/projects/project-info-sidebar";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectInfo, setProjectInfo] = useState<any>(null);

  const projectId = params.id as unknown as number;

  useEffect(() => {
    async function fetchProjectData() {
      try {
        setLoading(true);
        setError(null);

        const projectData = await getProjectDetails(projectId);
        setProjectInfo(projectData);
      } catch (err) {
        console.error("Error fetching project data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load project data",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProjectData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex flex-1 h-[60vh] items-center justify-center">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex-1 py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ProjectInfoSidebar projectInfo={projectInfo} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}
