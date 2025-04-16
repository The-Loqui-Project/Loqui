"use client";
import { useRouter } from "next/navigation";
import type { StringItem } from "@/lib/api-client-wrapper";
import TranslationInterface from "@/components/projects/translation-interface";

interface TranslationInterfaceWrapperProps {
  projectId: number;
  strings: StringItem[];
  selectedLanguage: string | null;
}

export default function TranslationInterfaceWrapper({
  projectId,
  strings,
  selectedLanguage,
}: TranslationInterfaceWrapperProps) {
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
