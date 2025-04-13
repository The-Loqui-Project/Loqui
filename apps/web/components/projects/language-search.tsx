"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader, Loader2, Search } from "lucide-react";
import type { Language, TranslationProgress } from "@/lib/api-client-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCountryFlag } from "@/lib/utils";

export default function LanguageSearch({
  languages,
  progress,
  onSelectLanguage,
}: {
  languages: Language[];
  progress: TranslationProgress;
  onSelectLanguage: (code: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter out English source language
  const filteredLanguages = languages.filter((lang) => lang.code !== "en_us");

  // Check if any language is being processed (has NaN progress)
  const isProcessing = filteredLanguages.some((lang) => {
    const langProgress = progress[lang.code];
    return langProgress && isNaN(langProgress.translated / langProgress.total);
  });

  // Filter languages based on search and hide those with NaN progress
  const searchedLanguages = filteredLanguages.filter((lang) => {
    const langProgress = progress[lang.code];
    const isNaNProgress =
      langProgress && isNaN(langProgress.translated / langProgress.total);

    // Only include languages that match search AND don't have NaN progress
    return (
      !isNaNProgress &&
      (searchQuery === "" ||
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const renderLanguageCard = (language: Language) => {
    const langProgress = progress[language.code];
    const percentage = langProgress
      ? Math.round((langProgress.translated / langProgress.total) * 100)
      : 0;

    return (
      <Card
        key={language.code}
        className={`cursor-pointer transition-colors hover:bg-accent/50`}
        onClick={() => onSelectLanguage(language.code)}
      >
        <CardContent className="p-3">
          <div className="flex flex-col">
            <span className="font-medium">
              {getCountryFlag(language.code)} {language.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {language.code}
            </span>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="mt-1 text-xs text-muted-foreground">
              {percentage}% complete
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {isProcessing && (
        <Alert className="bg-muted/50">
          <AlertDescription className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span>
              This project is being processed. This may take some time depending
              on its size...
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search languages..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {searchedLanguages.length > 0 ? (
          [...searchedLanguages]
            .sort((a, b) => {
              const aProgress = progress[a.code];
              const bProgress = progress[b.code];
              const aPercentage = aProgress
                ? (aProgress.translated / aProgress.total) * 100
                : 0;
              const bPercentage = bProgress
                ? (bProgress.translated / bProgress.total) * 100
                : 0;
              return bPercentage - aPercentage; // Sort descending (highest first)
            })
            .map(renderLanguageCard)
        ) : (
          <p className="col-span-full text-center text-sm text-muted-foreground">
            {isProcessing
              ? "Project is being processed. Check back soon."
              : "No languages found"}
          </p>
        )}
      </div>
    </div>
  );
}
