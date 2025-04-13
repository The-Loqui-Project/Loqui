import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
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
  saving: boolean;
}

export default function TranslationForm({
  stringId,
  stringValue,
  stringKey,
  initialTranslation = "",
  initialNote = "",
  onSubmit,
  saving,
}: TranslationFormProps) {
  const [translation, setTranslation] = useState(initialTranslation);
  const [note, setNote] = useState(initialNote);

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
        <div className="text-xs text-muted-foreground font-mono">
          Key: {stringKey}
        </div>
      </div>

      {/* Translation input (right side) */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-medium">Submit New Proposal</div>
        </div>

        <div className="relative">
          <Textarea
            placeholder="Enter translation..."
            className="min-h-24 resize-none"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
          />
          <div className="absolute top-2 right-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-1" />
              )}
              Submit Proposal
            </Button>
          </div>
        </div>

        <div className="mt-2">
          <Textarea
            placeholder="Add notes or context (optional)..."
            className="text-sm resize-none h-16"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
