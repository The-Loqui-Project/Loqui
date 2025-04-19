"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProjectDetails } from "@/lib/api-client-wrapper";
import { Loader2, Flag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProjectInfoSidebar from "@/components/projects/project-info-sidebar";
import ProjectReportModal from "@/components/projects/project-report-modal";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

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
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {projectInfo.title}
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setReportModalOpen(true)}
          className="flex items-center gap-1 text-yellow-600 hover:text-yellow-700"
        >
          <Flag className="h-4 w-4" />
          Report Project
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ProjectInfoSidebar projectInfo={projectInfo} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">{children}</div>
      </div>

      {/* Report Modal */}
      <ProjectReportModal
        projectId={projectId}
        projectTitle={projectInfo?.title || ""}
        projectSlug={projectInfo?.slug || ""}
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
      />
    </div>
  );
}
