import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NavigationHeaderProps {
  onBack: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  currentIndex: number;
  totalStrings: number;
  onPrevious: () => void;
  onNext: () => void;
}

export default function NavigationHeader({
  onBack,
  searchTerm,
  onSearchChange,
  currentIndex,
  totalStrings,
  onPrevious,
  onNext,
}: NavigationHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 gap-4">
      <Button variant="outline" onClick={onBack}>
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Languages
      </Button>

      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search strings..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
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
