"use client";

import type React from "react";

import { useState, useRef, useEffect, type RefObject } from "react";
import { Command, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchResults } from "./search-results";
import { StringItem } from "../proposals/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StringItem[];
  onSelect: (item: StringItem) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

export function SearchModal({
  isOpen,
  onClose,
  items,
  onSelect,
  triggerRef,
}: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems =
    searchQuery.trim() === ""
      ? items
      : items.filter(
          (item) =>
            item.id
              .toString()
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.value.toLowerCase().includes(searchQuery.toLowerCase()),
        );

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && filteredItems[activeIndex]) {
      onSelect(filteredItems[activeIndex]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[550px] p-0 gap-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">Search Strings</DialogTitle>
        <div className="flex items-center border-b px-3">
          <Command className="w-4 h-4 mr-2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search..."
            className="h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
          />
          <div className="flex items-center ml-auto mr-8">
            <kbd className="hidden sm:flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              ESC
            </kbd>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          <SearchResults
            items={filteredItems}
            onSelect={onSelect}
            searchQuery={searchQuery}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground border-t">
          <div className="flex gap-2">
            <span className="flex items-center gap-1">
              <kbd className="h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                ↑
              </kbd>
              <kbd className="h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                ↓
              </kbd>
              to navigate
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              ENTER
            </kbd>
            to select
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
