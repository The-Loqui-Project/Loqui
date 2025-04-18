import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "../search/search-bar";
import { StringItem } from "./types";

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
}

export default function NavigationHeader({
  onBack,
  currentIndex,
  totalStrings,
  onPrevious,
  onNext,
  items = [],
  onSelectString,
}: NavigationHeaderProps) {
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
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {currentIndex + 1} of {totalStrings} strings
        </span>
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
