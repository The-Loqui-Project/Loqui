import { useState, useEffect } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TranslationFormProps {
  stringId: number;
  stringValue: string;
  stringKey: string;
  initialTranslation?: string;
  initialNote?: string;
  onSubmit: (
    stringId: number,
    translation: string,
    note?: string,
  ) => Promise<void>;
  onTranslationChange?: (stringId: number, value: string) => void;
  onNoteChange?: (stringId: number, value: string) => void;
  saving: boolean;
}

export default function TranslationForm({
  stringId,
  stringValue,
  stringKey,
  initialTranslation = "",
  initialNote = "",
  onSubmit,
  onTranslationChange,
  onNoteChange,
  saving,
}: TranslationFormProps) {
  const [translation, setTranslation] = useState(initialTranslation);
  const [note, setNote] = useState(initialNote);

  // Update local state when props change (e.g., when switching strings)
  useEffect(() => {
    setTranslation(initialTranslation);
    setNote(initialNote);
  }, [initialTranslation, initialNote, stringId]);

  // Update local state and propagate changes to parent component
  const handleTranslationChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;
    setTranslation(value);
    if (onTranslationChange) {
      onTranslationChange(stringId, value);
    }
  };

  // Update local state and propagate changes to parent component
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNote(value);
    if (onNoteChange) {
      onNoteChange(stringId, value);
    }
  };

  const handleSubmit = () => {
    onSubmit(stringId, translation, note || undefined);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card rounded-lg border p-4">
      {/* Source string (left side) */}
      <div className="flex flex-col">
        <div className="mb-1 text-sm font-medium">Source (English)</div>
        <div className="min-h-24 p-3 rounded-md bg-muted/50 mb-2">
          {stringValue}
        </div>
        <div className="text-xs text-muted-foreground text-wrap break-words overflow-hidden text-ellipsis font-mono">
          Key: {stringKey}
        </div>
      </div>

      {/* Translation input (right side) */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-medium">Submit New Proposal</div>
        </div>

        <Textarea
          placeholder="Enter translation..."
          className="min-h-24 resize-none mb-2"
          value={translation}
          onChange={handleTranslationChange}
        />

        <Textarea
          placeholder="Add notes or context (optional)..."
          className="text-sm resize-none h-16 mb-2"
          value={note}
          onChange={handleNoteChange}
        />

        <Button
          variant="outline"
          size="sm"
          className="self-end"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-1" />
          )}
          Submit Proposal
        </Button>
      </div>
    </div>
  );
}
