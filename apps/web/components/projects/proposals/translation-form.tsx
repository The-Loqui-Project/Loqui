/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { Loader2, Send, Copy, Check, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import StringReportModal from "./string-report-modal";

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
  const { toast } = useToast();
  const [copyingValue, setCopyingValue] = useState(false);
  const [copyingKey, setCopyingKey] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

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

  // Copy source string value to clipboard
  const copyValueToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(stringValue);
      setCopyingValue(true);
      toast({
        title: "Copied!",
        description: "Source text copied to clipboard",
      });
      // Reset copy icon after 2 seconds
      setTimeout(() => setCopyingValue(false), 2000);
    } catch (_err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  // Copy key to clipboard
  const copyKeyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(stringKey);
      setCopyingKey(true);
      toast({
        title: "Copied!",
        description: "Key copied to clipboard",
      });
      // Reset copy icon after 2 seconds
      setTimeout(() => setCopyingKey(false), 2000);
    } catch (_err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy key to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card rounded-lg border p-4">
      {/* Source string (left side) */}
      <div className="flex flex-col">
        <div className="mb-1 text-sm font-medium flex justify-between items-center">
          <span>Source (English)</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReportModalOpen(true)}
            className="h-7 px-2 text-xs"
          >
            <Flag className="h-3 w-3 mr-1" />
            Report
          </Button>
        </div>
        <div className="group relative min-h-24 p-3 rounded-md bg-muted/50 mb-2">
          {stringValue}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={copyValueToClipboard}
            title="Copy source text"
          >
            {copyingValue ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground text-wrap break-words overflow-hidden text-ellipsis font-mono group relative">
          Key: {stringKey}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={copyKeyToClipboard}
            title="Copy key"
          >
            {copyingKey ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
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

      {/* String Report Modal */}
      <StringReportModal
        stringId={stringId}
        stringValue={stringValue}
        stringKey={stringKey}
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
      />
    </div>
  );
}
