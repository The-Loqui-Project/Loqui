import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Flag, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProjectReportModal from "@/components/projects/project-report-modal";

interface ProjectCardProps {
  id: string | number;
  title: string;
  description: string;
  progress: number;
  stats: {
    label: string;
    value: string | number;
  }[];
  buttonText: string;
  buttonHref: string;
  imageUrl?: string;
  slug?: string;
  hideReportButton?: boolean; // Added prop to conditionally hide report button
}

export function ProjectCard({
  id,
  title,
  description,
  progress,
  stats,
  buttonText,
  buttonHref,
  imageUrl,
  slug,
  hideReportButton = false,
}: ProjectCardProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
        {imageUrl && (
          <div className="flex-shrink-0 w-16 h-16 relative rounded-md overflow-hidden">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={`Icon for ${title}`}
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
        )}
        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex justify-between items-start">
            <CardTitle>{title}</CardTitle>
            {!hideReportButton && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setReportModalOpen(true)}
                    className="text-yellow-600"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Translation Progress:</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm mt-4">
            {stats.map((stat, index) => (
              <div key={index}>
                <p className="text-muted-foreground">{stat.label}</p>
                <p className="font-medium">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <a href={buttonHref}>{buttonText}</a>
        </Button>
      </CardFooter>

      {/* Report Modal */}
      <ProjectReportModal
        projectId={id}
        projectTitle={title}
        projectSlug={slug || id.toString()}
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
      />
    </Card>
  );
}
