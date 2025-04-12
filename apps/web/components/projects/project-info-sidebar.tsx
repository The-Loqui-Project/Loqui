import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Github, MessageSquare } from "lucide-react";

interface ProjectInfo {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  client_side: "required" | "optional" | "unsupported" | "unknown";
  server_side: "required" | "optional" | "unsupported" | "unknown";
  body: string;
  status: string;
  downloads: number;
  followers: number;
  issues_url?: string;
  source_url?: string;
  wiki_url?: string;
  discord_url?: string;
}

export default function ProjectInfoSidebar({
  projectInfo,
}: {
  projectInfo: ProjectInfo;
}) {
  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{projectInfo.title}</CardTitle>
          <CardDescription>{projectInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-1 text-sm font-medium">Categories</h4>
            <div className="flex flex-wrap gap-1">
              {projectInfo.categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <h4 className="mb-1 text-sm font-medium">Downloads</h4>
              <p className="text-sm">
                {projectInfo.downloads.toLocaleString()}
              </p>
            </div>
            <div>
              <h4 className="mb-1 text-sm font-medium">Followers</h4>
              <p className="text-sm">
                {projectInfo.followers.toLocaleString()}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Links</h4>
            <div className="grid grid-cols-2 gap-2">
              {projectInfo.source_url && (
                <a
                  href={projectInfo.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-3.5 w-3.5" />
                  Source Code
                </a>
              )}
              {projectInfo.issues_url && (
                <a
                  href={projectInfo.issues_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-3.5 w-3.5" />
                  Issues
                </a>
              )}
              {projectInfo.wiki_url && (
                <a
                  href={projectInfo.wiki_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Wiki
                </a>
              )}
              {projectInfo.discord_url && (
                <a
                  href={projectInfo.discord_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Discord
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
