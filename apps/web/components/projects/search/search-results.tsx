"use client";

import { StringItem } from "@/lib/api-client";
import { SearchResultItem } from "./search-result-item";

interface SearchResultsProps {
  items: StringItem[];
  searchQuery: string;
  onSelect: (item: StringItem) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export function SearchResults({
  items,
  searchQuery,
  onSelect,
  activeIndex,
  setActiveIndex,
}: SearchResultsProps) {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No results found.
      </div>
    );
  }

  // Group items by namespace (part before the first colon) or first letter if no colon
  const groupedItems: Record<string, StringItem[]> = {};

  items.forEach((item) => {
    // Extract namespace from key (part before first colon) or use first letter
    const namespace = (
      item.key.includes(":")
        ? item.key.split(":")[0]
        : item.key.charAt(0).toUpperCase()
    )!;

    if (!groupedItems[namespace]) {
      groupedItems[namespace] = [];
    }
    groupedItems[namespace].push(item);
  });

  // Flatten the grouped items to calculate the correct active index
  const flattenedItems = items;

  return (
    <div className="py-2">
      {Object.entries(groupedItems).map(([group, groupItems]) => (
        <div key={group} className="mb-2">
          <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
            {group}
          </div>
          <div>
            {groupItems.map((item) => {
              const itemIndex = flattenedItems.findIndex(
                (i) => i.id === item.id,
              );
              return (
                <SearchResultItem
                  key={item.id}
                  item={item}
                  searchQuery={searchQuery}
                  onSelect={() => onSelect(item)}
                  isActive={activeIndex === itemIndex}
                  onMouseEnter={() => setActiveIndex(itemIndex)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
