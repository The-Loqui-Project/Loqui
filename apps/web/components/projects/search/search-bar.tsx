"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchModal } from "./search-modal";
import { StringItem } from "@/lib/api-client";

interface SearchBarProps {
  items: StringItem[];
  placeholder?: string;
  onSelect?: (item: StringItem) => void;
}

export function SearchBar({
  items,
  placeholder = "Search...",
  onSelect,
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const handleSelect = (item: StringItem) => {
    if (onSelect) {
      onSelect(item);
    }
    setIsOpen(false);
  };

  // Close on escape key only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Button
        ref={searchButtonRef}
        variant="outline"
        className="w-full justify-start text-sm text-muted-foreground relative h-9 px-4 py-2"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>{placeholder}</span>
      </Button>

      <SearchModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={items}
        onSelect={handleSelect}
        triggerRef={searchButtonRef}
      />
    </>
  );
}
