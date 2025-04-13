"use client";

import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { getCountryFlag } from "@/lib/utils";
import {
  type StringItem,
  getStringDetails,
  getStringProposals,
  createProposal,
  voteOnProposal,
  createTranslation,
  deleteProposal,
  editProposal,
  getProjectProgress,
  TranslationProgress,
  getLanguages,
  Language,
} from "@/lib/api-client-wrapper";

import NavigationHeader from "./proposals/navigation-header";
import ProgressPanel from "./proposals/progress-panel";
import TranslationForm from "./proposals/translation-form";
import ProposalList from "./proposals/proposal-list";
import { Proposal } from "./proposals/types";

interface TranslationInterfaceProps {
  projectId: number;
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
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStrings, setFilteredStrings] = useState<StringItem[]>(strings);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [proposals, setProposals] = useState<Record<string, Proposal[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<TranslationProgress>({});
  const [languages, setLanguages] = useState<Language[]>([]);

  // Fetch languages when component loads
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const languagesData = await getLanguages();
        setLanguages(languagesData);
      } catch (error) {
        console.error("Error fetching languages:", error);
      }
    };

    fetchLanguages();
  }, []);

  // Filter strings when search term changes
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

  // Load proposals for the current string
  useEffect(() => {
    if (filteredStrings.length > 0 && selectedLanguage) {
      loadProposalsForString(filteredStrings[currentIndex]!.id);
    }
  }, [currentIndex, filteredStrings, selectedLanguage]);

  // Fetch project progress when component loads or language changes
  useEffect(() => {
    if (projectId && selectedLanguage) {
      fetchProjectProgress();
    }
  }, [projectId, selectedLanguage]);

  const loadProposalsForString = async (stringId: number) => {
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

  const fetchProjectProgress = async () => {
    if (!projectId) return;

    try {
      const progressData = await getProjectProgress(projectId);
      setProgress(progressData);
    } catch (error) {
      console.error("Error fetching project progress:", error);
    }
  };

  const handleSaveTranslation = async (
    stringId: number,
    translationText: string,
    note?: string,
  ) => {
    const token = getCookie("token");
    if (!token || !selectedLanguage) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit translations",
        variant: "destructive",
      });
      return;
    }

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
        note,
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
    stringId: number,
    proposalId: number,
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

  const handleDeleteProposal = async (proposalId: number) => {
    const token = getCookie("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete proposals",
        variant: "destructive",
      });
      return;
    }

    const currentString = filteredStrings[currentIndex];
    if (!currentString) return;

    try {
      setDeleting((prev) => ({ ...prev, [proposalId]: true }));

      await deleteProposal(Number(proposalId), token.toString());

      toast({
        title: "Success",
        description: "Proposal deleted successfully",
      });

      // Reload proposals
      await loadProposalsForString(currentString.id);
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

  const handleEditProposal = async (
    proposalId: number,
    value: string,
    note: string,
  ) => {
    const token = getCookie("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to edit proposals",
        variant: "destructive",
      });
      return;
    }

    const currentString = filteredStrings[currentIndex];
    if (!currentString) return;

    if (!value.trim()) {
      toast({
        title: "Error",
        description: "Translation cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Check if this edit would create a duplicate
    const existingProposals = proposals[currentString.id] || [];
    const isDuplicate = existingProposals.some(
      (p) => p.id !== proposalId && p.value.trim() === value.trim(),
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
        value,
        note || undefined,
        token.toString(),
      );

      toast({
        title: "Success",
        description: "Proposal updated successfully",
      });

      // Reload proposals
      await loadProposalsForString(currentString.id);
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

  const handleSelectString = (selectedItem: StringItem) => {
    // Find the index of the selected string in the filtered strings
    const index = filteredStrings.findIndex(
      (item) => item.id === selectedItem.id,
    );
    if (index !== -1) {
      setCurrentIndex(index);
    }
  };

  const getCompletionPercentage = () => {
    if (!selectedLanguage || !progress[selectedLanguage]) return 0;

    // Use the progress data from the API for the selected language
    const langProgress = progress[selectedLanguage];
    return Math.round(langProgress.progress * 100);
  };

  const getLanguageDisplay = () => {
    if (!selectedLanguage) return null;

    const language = languages.find((lang) => lang.code === selectedLanguage);
    if (!language) return null;

    const flag = getCountryFlag(selectedLanguage);

    return (
      <div className="flex items-center gap-2 mb-4 px-2 py-1.5 bg-muted/50 rounded-md text-sm font-medium">
        <span className="text-lg">{flag}</span>
        <span>{language.name}</span>
        <span className="text-muted-foreground">({language.nativeName})</span>
      </div>
    );
  };

  // Empty state when no strings match search
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

  const currentString = filteredStrings[currentIndex]!;

  return (
    <div className="flex flex-col h-full">
      {getLanguageDisplay()}

      <NavigationHeader
        onBack={onBack}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        currentIndex={currentIndex}
        totalStrings={filteredStrings.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        items={strings}
        onSelectString={handleSelectString}
      />

      <ProgressPanel completionPercentage={getCompletionPercentage()} />

      <TranslationForm
        stringId={currentString.id}
        stringValue={currentString.value}
        stringKey={currentString.key}
        initialTranslation={translations[currentString.id] || ""}
        initialNote={notes[currentString.id] || ""}
        onSubmit={handleSaveTranslation}
        saving={saving[currentString.id] || false}
      />

      <ProposalList
        stringId={currentString.id}
        proposals={proposals[currentString.id]}
        loading={loading[currentString.id] || false}
        onVote={handleVote}
        onDelete={handleDeleteProposal}
        onEdit={handleEditProposal}
        deleting={deleting}
        editing={editing}
      />
    </div>
  );
}
