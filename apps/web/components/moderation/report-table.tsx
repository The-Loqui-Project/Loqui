"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileWarning, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ProjectReport,
  ProjectReportActionModal,
} from "./project-report-action-modal";
import {
  ProposalReport,
  ProposalReportActionModal,
} from "./proposal-report-action-modal";
import {
  StringReport,
  StringReportActionModal,
} from "./string-report-action-modal";

interface Report {
  id: number;
  type: "project" | "proposal" | "string";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "invalid";
  reason: string;
  createdAt: string;
  resolvedAt?: string;
  content: {
    id: number | string;
    value?: string;
    key?: string;
    title?: string;
    status?: string;
  };
  reporter: {
    id: string;
    role: string;
  };
  resolvedBy?: {
    id: string;
    role: string;
  };
}

interface ModeratorReportTableProps {
  reports: Report[];
  onReportsChange: () => void;
  filter: "all" | "project" | "proposal" | "string";
}

export function ModeratorReportTable({
  reports,
  onReportsChange,
  filter,
}: ModeratorReportTableProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [stringModalOpen, setStringModalOpen] = useState(false);

  const handleAction = (report: Report) => {
    setSelectedReport(report);

    switch (report.type) {
      case "project":
        setProjectModalOpen(true);
        break;
      case "proposal":
        setProposalModalOpen(true);
        break;
      case "string":
        setStringModalOpen(true);
        break;
    }
  };

  // Priority color mapping
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="default">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Status color mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            Open
          </Badge>
        );
      case "investigating":
        return (
          <Badge
            variant="outline"
            className="border-yellow-500 text-yellow-500"
          >
            Investigating
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            Resolved
          </Badge>
        );
      case "invalid":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-500">
            Invalid
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "project":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
          >
            Project
          </Badge>
        );
      case "proposal":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
          >
            Proposal
          </Badge>
        );
      case "string":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          >
            String
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy HH:mm");
    } catch {
      return "Invalid date";
    }
  };

  // Truncate long text
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  if (reports.length === 0) {
    return (
      <Alert>
        <FileWarning className="h-4 w-4" />
        <AlertDescription>
          No {filter !== "all" ? filter : ""} reports found.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Reported Item</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={`${report.type}-${report.id}`}>
                <TableCell>{getTypeBadge(report.type)}</TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="max-w-[200px] truncate">
                          {report.type === "project" && report.content.title
                            ? truncateText(report.content.title.toString(), 20)
                            : report.type === "proposal" && report.content.value
                              ? truncateText(
                                  report.content.value.toString(),
                                  20,
                                )
                              : report.type === "string" && report.content.value
                                ? truncateText(
                                    report.content.value.toString(),
                                    20,
                                  )
                                : "Unknown Item"}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-md">
                          {report.type === "project" && report.content.title ? (
                            <p>
                              <strong>Project:</strong> {report.content.title}
                            </p>
                          ) : report.type === "proposal" &&
                            report.content.value ? (
                            <p>
                              <strong>Proposal:</strong> {report.content.value}
                            </p>
                          ) : report.type === "string" ? (
                            <div>
                              <p>
                                <strong>String:</strong> {report.content.value}
                              </p>
                              {report.content.key && (
                                <p>
                                  <strong>Key:</strong> {report.content.key}
                                </p>
                              )}
                            </div>
                          ) : (
                            "Unknown Item"
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="max-w-[200px] truncate">
                          {truncateText(report.reason, 50)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-md whitespace-pre-wrap">
                          {report.reason}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>{getPriorityBadge(report.priority)}</TableCell>
                <TableCell>{getStatusBadge(report.status)}</TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>{report.reporter.id}</TooltipTrigger>
                      <TooltipContent>
                        <p>
                          <strong>Role:</strong> {report.reporter.role}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {formatDate(report.createdAt)}
                      </TooltipTrigger>
                      <TooltipContent>
                        {report.resolvedAt ? (
                          <p>
                            <strong>Resolved:</strong>{" "}
                            {formatDate(report.resolvedAt)}
                          </p>
                        ) : (
                          <p>
                            <strong>Unresolved</strong>
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAction(report)}>
                          Take action
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className={
                            report.status === "investigating"
                              ? "text-yellow-500"
                              : ""
                          }
                          onClick={() => handleAction(report)}
                        >
                          {report.status === "investigating"
                            ? "Update investigation"
                            : "Mark as investigating"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={
                            report.status === "resolved" ? "text-green-500" : ""
                          }
                          onClick={() => handleAction(report)}
                        >
                          Mark as resolved
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className={
                            report.status === "invalid" ? "text-gray-500" : ""
                          }
                          onClick={() => handleAction(report)}
                        >
                          Mark as invalid
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedReport && selectedReport.type === "project" && (
        <ProjectReportActionModal
          report={selectedReport as ProjectReport}
          open={projectModalOpen}
          onOpenChange={setProjectModalOpen}
          onActionComplete={onReportsChange}
        />
      )}

      {selectedReport && selectedReport.type === "proposal" && (
        <ProposalReportActionModal
          report={selectedReport as ProposalReport}
          open={proposalModalOpen}
          onOpenChange={setProposalModalOpen}
          onActionComplete={onReportsChange}
        />
      )}

      {selectedReport && selectedReport.type === "string" && (
        <StringReportActionModal
          report={selectedReport as StringReport}
          open={stringModalOpen}
          onOpenChange={setStringModalOpen}
          onActionComplete={onReportsChange}
        />
      )}
    </>
  );
}
