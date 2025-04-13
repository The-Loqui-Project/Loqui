"use client";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleBack = () => {
    router.push(`/project/${projectId}`);
  };

  return (
    <TranslationInterface
      projectId={projectId}
      strings={strings}
      selectedLanguage={selectedLanguage}
      onBack={handleBack}
    />
  );
}
