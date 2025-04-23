"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "../search/search-bar";
import type { StringItem } from "./types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NavigationHeaderProps {
  onBack: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  currentIndex: number;
  totalStrings: number;
  onPrevious: () => void;
  onNext: () => void;
  items?: StringItem[];
  onSelectString: (selectedItem: StringItem) => void;
  onJumpToIndex: (index: number) => void;
}

export default function NavigationHeader({
  onBack,
  searchTerm,
  onSearchChange,
  currentIndex,
  totalStrings,
  onPrevious,
  onNext,
  items = [],
  onSelectString,
  onJumpToIndex,
}: NavigationHeaderProps) {
  const [inputValue, setInputValue] = useState((currentIndex + 1).toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const maxDigits = totalStrings.toString().length;

  useEffect(() => {
    setInputValue((currentIndex + 1).toString());
    adjustInputWidth();
  }, [currentIndex]);

  const adjustInputWidth = () => {
    if (inputRef.current) {
      const valueLength = inputValue.length || 1;
      // Cap the width at the maximum needed for totalStrings
      const width = Math.min(valueLength, maxDigits);
      // Add more padding
      inputRef.current.style.width = `${Math.max(2, width + 0.5)}rem`;
    }
  };

  const resetInput = () => {
    setInputValue((currentIndex + 1).toString());
    setTimeout(adjustInputWidth, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setTimeout(adjustInputWidth, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const index = Number.parseInt(inputValue, 10);
      if (!isNaN(index) && index >= 1 && index <= totalStrings) {
        onJumpToIndex(index - 1);
      } else {
        resetInput();
      }
    }
  };

  const handleBlur = () => {
    resetInput();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
      <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Languages
      </Button>

      <div className="flex-1 w-full sm:max-w-md">
        <SearchBar
          items={items}
          placeholder="Search strings..."
          onSelect={onSelectString}
        />
      </div>

      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className={cn(
              "text-center border rounded-md text-sm min-w-[2.5rem] max-w-[5rem] px-1",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            )}
            min={1}
            max={totalStrings}
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            of {totalStrings} strings
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNext}
            disabled={currentIndex === totalStrings - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
