"use client";

import { useEffect, useRef } from "react";
import { StringItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { File } from "lucide-react";

interface SearchResultItemProps {
  item: StringItem;
  searchQuery: string;
  onSelect: () => void;
  isActive: boolean;
  onMouseEnter: () => void;
}

export function SearchResultItem({
  item,
  searchQuery,
  onSelect,
  isActive,
  onMouseEnter,
}: SearchResultItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  // Scroll active item into view
  useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isActive]);

  // Highlight matching text
  const highlightMatch = (text: string) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(
      `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );

    // Use dangerouslySetInnerHTML to avoid gaps between elements
    // This ensures the text renders without any spacing issues
    const html = text.replace(
      regex,
      '<mark class="bg-yellow-100 dark:bg-yellow-800">$1</mark>',
    );

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div
      ref={itemRef}
      className={cn(
        "flex items-center px-4 py-2 cursor-pointer hover:bg-muted/50",
        isActive && "bg-muted",
      )}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
    >
      <File className="h-4 w-4 mr-2 text-muted-foreground" />
      <div className="flex flex-col w-full">
        <div className="font-medium flex items-center gap-2">
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
            ID: {highlightMatch(String(item.id))}
          </span>
          {highlightMatch(item.key)}
        </div>
        {item.value && (
          <div className="text-sm text-muted-foreground">
            {highlightMatch(item.value)}
          </div>
        )}
      </div>
    </div>
  );
}
