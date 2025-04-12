import { useState, useEffect } from "react";
import { StringItem, getStringProposals, ProposalItem } from "@/lib/api-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProposalDialog from "@/components/projects/proposal-dialog";

interface ProjectStringsListProps {
  projectId: string;
  strings: StringItem[];
  selectedLanguage: string | null;
}

export default function ProjectStringsList({
  projectId,
  strings,
  selectedLanguage,
}: ProjectStringsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStrings, setFilteredStrings] = useState<StringItem[]>(strings);
  const [selectedString, setSelectedString] = useState<StringItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStrings(strings);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      setFilteredStrings(
        strings.filter(
          (s) =>
            s.key.toLowerCase().includes(lowercaseSearch) ||
            s.value.toLowerCase().includes(lowercaseSearch),
        ),
      );
    }
  }, [searchTerm, strings]);

  const handleStringSelect = (string: StringItem) => {
    setSelectedString(string);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search strings..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Key</TableHead>
                <TableHead className="w-1/2">English Value</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStrings.length > 0 ? (
                filteredStrings.map((string) => (
                  <TableRow key={string.id}>
                    <TableCell className="font-mono text-sm">
                      {string.key}
                    </TableCell>
                    <TableCell>{string.value}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStringSelect(string)}
                      >
                        Translate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-4 text-muted-foreground"
                  >
                    {searchTerm
                      ? "No strings match your search"
                      : "No strings found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {selectedString && selectedLanguage && (
        <ProposalDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          projectId={projectId}
          stringItem={selectedString}
          languageCode={selectedLanguage}
        />
      )}
    </div>
  );
}
