"use client";

import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import {
  type StringItem,
  getStringDetails,
  getStringProposals,
  createProposal,
  voteOnProposal,
  createTranslation,
  deleteProposal,
  editProposal,
} from "@/lib/api-client-wrapper";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Loader2,
  AlertCircle,
  Trash2,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

// Define proper types for the proposals
interface Proposal {
  id: string;
  value: string;
  note?: string;
  score: number;
  status?: "accurate" | "inaccurate";
  user?: {
    id: string;
  };
}

interface TranslationInterfaceProps {
  projectId: string;
  strings: StringItem[];
  selectedLanguage: string | null;
  onBack: () => void;
}

export default function TranslationInterface({
  projectId,
  strings,
  selectedLanguage,
  onBack,
}: TranslationInterfaceProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStrings, setFilteredStrings] = useState<StringItem[]>(strings);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [proposals, setProposals] = useState<Record<string, Proposal[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [editingProposal, setEditingProposal] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editNote, setEditNote] = useState("");
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

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

  useEffect(() => {
    // Load proposals for visible strings
    if (filteredStrings.length > 0 && selectedLanguage) {
      loadProposalsForString(filteredStrings[currentIndex]!.id);
    }
  }, [currentIndex, filteredStrings, selectedLanguage]);

  const loadProposalsForString = async (stringId: string) => {
    if (!selectedLanguage || loading[stringId]) return;

    try {
      setLoading((prev) => ({ ...prev, [stringId]: true }));

      const result = await getStringProposals(stringId, selectedLanguage);
      setProposals((prev: any) => ({
        ...prev,
        [stringId]: result.proposals || [],
      }));

      // If there are proposals, pre-fill with the highest voted one
      if (result.proposals && result.proposals.length > 0) {
        const bestProposal = [...result.proposals].sort(
          (a, b) => b.score - a.score,
        )[0];
        if (bestProposal) {
          setTranslations((prev) => ({
            ...prev,
            [stringId]: bestProposal.value,
          }));
          if (bestProposal.note) {
            setNotes((prev) => ({
              ...prev,
              [stringId]: bestProposal.note!,
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error loading proposals:", error);
    } finally {
      setLoading((prev) => ({ ...prev, [stringId]: false }));
    }
  };

  const handleSaveTranslation = async (stringId: string) => {
    const token = getCookie("token");
    if (!token || !selectedLanguage) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit translations",
        variant: "destructive",
      });
      return;
    }

    const translationText = translations[stringId];
    if (!translationText?.trim()) {
      toast({
        title: "Error",
        description: "Translation cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Check if this is a duplicate of an existing proposal
    const existingProposals = proposals[stringId] || [];
    const isDuplicate = existingProposals.some(
      (p) => p.value.trim() === translationText.trim(),
    );

    if (isDuplicate) {
      toast({
        title: "Error",
        description: "This translation already exists as a proposal",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, [stringId]: true }));

      // Get string details to find translation ID
      const details = await getStringDetails(projectId, stringId);
      let translation = details.translations?.find(
        (t: any) => t.languageCode === selectedLanguage,
      );

      // If no translation record exists for this language, create one
      if (!translation) {
        console.log(
          `No translation found for ${selectedLanguage}, creating one...`,
        );
        const newTranslation = await createTranslation(
          stringId,
          selectedLanguage,
          token.toString(),
        );
        translation = {
          id: newTranslation.id,
          languageCode: selectedLanguage,
        };
      }

      // Create proposal
      await createProposal(
        translation.id,
        translationText,
        notes[stringId] || undefined,
        token.toString(),
      );

      toast({
        title: "Success",
        description: "Translation saved successfully",
      });

      // Reset the form
      setTranslations((prev) => ({
        ...prev,
        [stringId]: "",
      }));
      setNotes((prev) => ({
        ...prev,
        [stringId]: "",
      }));

      // Reload proposals
      await loadProposalsForString(stringId);
    } catch (error) {
      console.error("Error saving translation:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save translation",
        variant: "destructive",
      });
    } finally {
      setSaving((prev) => ({ ...prev, [stringId]: false }));
    }
  };

  const handleVote = async (
    stringId: string,
    proposalId: string,
    voteType: "up" | "down" | "none",
  ) => {
    const token = getCookie("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to vote",
        variant: "destructive",
      });
      return;
    }

    try {
      await voteOnProposal(proposalId, voteType, token.toString());

      // Reload proposals
      await loadProposalsForString(stringId);

      toast({
        title: "Success",
        description: "Your vote has been recorded",
      });
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to register vote",
        variant: "destructive",
      });
    }
  };

  const handleUseProposal = (stringId: string, proposal: any) => {
    setTranslations((prev) => ({ ...prev, [stringId]: proposal.value }));
    setNotes((prev) => ({ ...prev, [stringId]: proposal.note || "" }));
  };

  const handleNext = () => {
    if (currentIndex < filteredStrings.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const getCompletionPercentage = () => {
    if (filteredStrings.length === 0) return 0;

    // Count strings that have translations
    const translatedCount = Object.keys(translations).filter(
      (key) => translations[key]!.trim().length > 0,
    ).length;

    return Math.round((translatedCount / filteredStrings.length) * 100);
  };

  const handleDeleteProposal = async (proposalId: string) => {
    const token = getCookie("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete proposals",
        variant: "destructive",
      });
      return;
    }

    try {
      setDeleting((prev) => ({ ...prev, [proposalId]: true }));

      await deleteProposal(Number(proposalId), token.toString());

      toast({
        title: "Success",
        description: "Proposal deleted successfully",
      });

      // Reload proposals for the current string
      await loadProposalsForString(currentString!.id);
    } catch (error) {
      console.error("Error deleting proposal:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete proposal",
        variant: "destructive",
      });
    } finally {
      setDeleting((prev) => ({ ...prev, [proposalId]: false }));
    }
  };

  const startEditing = (proposal: Proposal) => {
    setEditingProposal(proposal.id);
    setEditValue(proposal.value);
    setEditNote(proposal.note || "");
  };

  const cancelEditing = () => {
    setEditingProposal(null);
    setEditValue("");
    setEditNote("");
  };

  const handleEditProposal = async (proposalId: string) => {
    const token = getCookie("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to edit proposals",
        variant: "destructive",
      });
      return;
    }

    if (!editValue.trim()) {
      toast({
        title: "Error",
        description: "Translation cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Check if this edit would create a duplicate
    const existingProposals = proposals[currentString!.id] || [];
    const isDuplicate = existingProposals.some(
      (p) => p.id !== proposalId && p.value.trim() === editValue.trim(),
    );

    if (isDuplicate) {
      toast({
        title: "Error",
        description: "This translation already exists as another proposal",
        variant: "destructive",
      });
      return;
    }

    try {
      setEditing((prev) => ({ ...prev, [proposalId]: true }));

      await editProposal(
        Number(proposalId),
        editValue,
        editNote || undefined,
        token.toString(),
      );

      toast({
        title: "Success",
        description: "Proposal updated successfully",
      });

      // Reset editing state
      setEditingProposal(null);
      setEditValue("");
      setEditNote("");

      // Reload proposals for the current string
      await loadProposalsForString(currentString!.id);
    } catch (error) {
      console.error("Error editing proposal:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to edit proposal",
        variant: "destructive",
      });
    } finally {
      setEditing((prev) => ({ ...prev, [proposalId]: false }));
    }
  };

  if (filteredStrings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          No strings found matching your search criteria.
        </p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          Back to Languages
        </Button>
      </div>
    );
  }

  const currentString = filteredStrings[currentIndex];

  return (
    <div className="flex flex-col h-full">
      {/* Header with navigation and search */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Languages
        </Button>

        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search strings..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {filteredStrings.length} strings
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === filteredStrings.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Translation Progress</span>
          <span>{getCompletionPercentage()}%</span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary"
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
      </div>

      {/* Add this after the progress bar */}
      <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
        <p className="font-medium mb-1">Translation Process:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Review existing proposals or create a new one</li>
          <li>Vote on proposals you agree with</li>
          <li>
            The proposal with the most votes will become the official
            translation
          </li>
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card rounded-lg border p-4">
        {/* Source string (left side) */}
        <div className="flex flex-col">
          <div className="mb-1 text-sm font-medium">Source (English)</div>
          <div className="min-h-24 p-3 rounded-md bg-muted/50 mb-2">
            {currentString!.value}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            Key: {currentString!.key}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium">
              Submit New Proposal ({selectedLanguage})
            </div>
          </div>

          <div className="relative">
            <Textarea
              placeholder="Enter translation..."
              className="min-h-24 resize-none"
              value={translations[currentString!.id] || ""}
              onChange={(e) =>
                setTranslations((prev) => ({
                  ...prev,
                  [currentString!.id]: e.target.value,
                }))
              }
            />
            <div className="absolute top-2 right-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => handleSaveTranslation(currentString!.id)}
                disabled={saving[currentString!.id]}
              >
                {saving[currentString!.id] ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-1" />
                )}
                Submit Proposal
              </Button>
            </div>
          </div>

          <div className="mt-2">
            <Textarea
              placeholder="Add notes or context (optional)..."
              className="text-sm resize-none h-16"
              value={notes[currentString!.id] || ""}
              onChange={(e) =>
                setNotes((prev) => ({
                  ...prev,
                  [currentString!.id]: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Main translation interface */}
      <div className="mt-4 border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Community Proposals</h3>
          <Badge variant="outline" className="ml-2">
            {proposals[currentString!.id]?.length || 0} Proposals
          </Badge>
        </div>

        {loading[currentString!.id] ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : proposals[currentString!.id] &&
          proposals[currentString!.id]!.length > 0 ? (
          <div className="space-y-3">
            {proposals[currentString!.id]!.map((proposal) => (
              <div
                key={proposal.id}
                className={cn(
                  "border rounded-md p-3",
                  proposal.status === "accurate" &&
                    "border-green-500/30 bg-green-50/30 dark:bg-green-950/10",
                  proposal.status === "inaccurate" &&
                    "border-red-500/30 bg-red-50/30 dark:bg-red-950/10",
                  editingProposal === proposal.id &&
                    "border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/10",
                )}
              >
                {editingProposal === proposal.id ? (
                  // Editing interface
                  <div className="space-y-3">
                    <Textarea
                      className="min-h-24 resize-none"
                      value={editValue}
                      placeholder="Enter translation..."
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <Textarea
                      className="resize-none h-16 text-sm"
                      value={editNote}
                      placeholder="Add notes or context (optional)..."
                      onChange={(e) => setEditNote(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditProposal(proposal.id)}
                        disabled={editing[proposal.id]}
                      >
                        {editing[proposal.id] ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Normal display interface
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {proposal.status === "accurate" && (
                          <Badge className="bg-green-500">Accurate</Badge>
                        )}
                        {proposal.status === "inaccurate" && (
                          <Badge className="bg-red-500">Inaccurate</Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          by {proposal.user?.id || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {proposal.user?.id === user?.modrinthUserData?.id ||
                        "" ? (
                          <div className="flex items-center">
                            <Badge className="bg-blue-500 mr-2">Yours</Badge>
                            {/* Only show edit/delete options if score is 0 */}
                            {proposal.score === 0 && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-blue-500 hover:text-blue-600"
                                  onClick={() => startEditing(proposal)}
                                  title="Edit proposal"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:text-red-600"
                                  onClick={() =>
                                    handleDeleteProposal(proposal.id)
                                  }
                                  disabled={deleting[proposal.id]}
                                  title="Delete proposal"
                                >
                                  {deleting[proposal.id] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                handleVote(currentString!.id, proposal.id, "up")
                              }
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <span className="mx-1 text-sm font-medium">
                              {proposal.score}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                handleVote(
                                  currentString!.id,
                                  proposal.id,
                                  "down",
                                )
                              }
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="mb-1">{proposal.value}</p>
                    {proposal.note && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Note:</span>{" "}
                        {proposal.note}
                      </p>
                    )}
                    <div className="mt-2 flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        {proposal.score > 0
                          ? "Leading proposal"
                          : "Vote to support this proposal"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            No proposals for this string yet. Be the first to contribute!
          </p>
        )}
      </div>
    </div>
  );
}
