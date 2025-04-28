"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Filter, Search } from "lucide-react";
import { getCookie } from "cookies-next";
import { getAllReports, getCurrentUser } from "@/lib/api-client-wrapper";
import { ModeratorReportTable } from "@/components/moderation/report-table";

export default function ModerationPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<
    "open" | "investigating" | "resolved" | "invalid" | "all"
  >("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<{
    isModerator: boolean;
    isAdmin: boolean;
  } | null>(null);

  // Fetch user role and check permissions
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const token = getCookie("token");
      if (!token) {
        router.push("/");
        return;
      }

      getCurrentUser(token.toString())
        .then((userData) => {
          setUserRole({
            isModerator: userData.isModerator,
            isAdmin: userData.isAdmin,
          });

          // If not a moderator, redirect to home
          if (!userData.isModerator) {
            router.push("/");
          }
        })
        .catch((err) => {
          console.error("Error fetching user role:", err);
          router.push("/");
        });
    } else if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch reports when status changes or component mounts
  useEffect(() => {
    if (userRole?.isModerator) {
      fetchReports();
    }
  }, [userRole, selectedStatus]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getCookie("token");
      if (!token) {
        setError("Authentication token not found");
        setLoading(false);
        return;
      }

      const data = await getAllReports(token.toString(), selectedStatus);
      setReportsData(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Filter reports based on search query
  const filteredReports = reportsData?.reports?.filter((report: any) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    // Search in content
    const contentMatches =
      (report.content.value &&
        report.content.value.toLowerCase().includes(query)) ||
      (report.content.key &&
        report.content.key.toLowerCase().includes(query)) ||
      (report.content.title &&
        report.content.title.toLowerCase().includes(query));

    // Search in reason
    const reasonMatches = report.reason.toLowerCase().includes(query);

    // Search in reporter username
    const reporterMatches = report.reporter.id.toLowerCase().includes(query);

    return contentMatches || reasonMatches || reporterMatches;
  });

  // Show loading state or redirect if not authorized
  if (isLoading || !userRole) {
    return (
      <main className="flex-1 container py-8 flex flex-col space-y-10">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  // If not a moderator, the router will redirect
  if (!userRole.isModerator) {
    return null;
  }

  return (
    <main className="flex-1 container py-8 flex flex-col space-y-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Moderation Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage reports and moderate content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchReports}>
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/15 border border-destructive text-destructive p-4 rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedStatus}
                onValueChange={(value: any) => setSelectedStatus(value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="invalid">Invalid</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {!loading && reportsData && (
                <div className="ml-auto flex gap-2">
                  <Badge variant="outline" className="py-1 px-3">
                    Total: {reportsData.total.all}
                  </Badge>
                  <Badge variant="secondary" className="py-1 px-3">
                    Projects: {reportsData.total.project}
                  </Badge>
                  <Badge variant="secondary" className="py-1 px-3">
                    Proposals: {reportsData.total.proposal}
                  </Badge>
                  <Badge variant="secondary" className="py-1 px-3">
                    Strings: {reportsData.total.string}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="project">Projects</TabsTrigger>
                <TabsTrigger value="proposal">Proposals</TabsTrigger>
                <TabsTrigger value="string">Strings</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <ModeratorReportTable
                  reports={filteredReports || []}
                  onReportsChange={fetchReports}
                  filter="all"
                />
              </TabsContent>

              <TabsContent value="project" className="mt-4">
                <ModeratorReportTable
                  reports={(filteredReports || []).filter(
                    (r: { type: string }) => r.type === "project",
                  )}
                  onReportsChange={fetchReports}
                  filter="project"
                />
              </TabsContent>

              <TabsContent value="proposal" className="mt-4">
                <ModeratorReportTable
                  reports={(filteredReports || []).filter(
                    (r: { type: string }) => r.type === "proposal",
                  )}
                  onReportsChange={fetchReports}
                  filter="proposal"
                />
              </TabsContent>

              <TabsContent value="string" className="mt-4">
                <ModeratorReportTable
                  reports={(filteredReports || []).filter(
                    (r: { type: string }) => r.type === "string",
                  )}
                  onReportsChange={fetchReports}
                  filter="string"
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </main>
  );
}
