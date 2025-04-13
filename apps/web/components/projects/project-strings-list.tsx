"use client";
import type { StringItem } from "@/lib/api-client-wrapper";
import TranslationInterface from "@/components/projects/translation-interface";

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
  return (
    <TranslationInterface
      projectId={projectId}
      strings={strings}
      selectedLanguage={selectedLanguage}
      onBack={() => {
        // This will be handled by the parent component's backToLanguages function
        window.history.back();
      }}
    />
  );
}
