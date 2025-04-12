import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { getCookie } from "cookies-next";
import { editProposal } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface ProposalEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: {
    id: number;
    value: string;
    note?: string;
  };
  onComplete: () => void;
}

export default function ProposalEditDialog({
  open,
  onOpenChange,
  proposal,
  onComplete,
}: ProposalEditDialogProps) {
  const [value, setValue] = useState(proposal.value || "");
  const [note, setNote] = useState(proposal.note || "");
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async () => {
    const token = getCookie("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to edit proposals",
        variant: "destructive",
      });
      return;
    }

    if (!value.trim()) {
      toast({
        title: "Error",
        description: "Translation cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      await editProposal(
        proposal.id,
        value,
        note || undefined,
        token.toString(),
      );

      toast({
        title: "Success",
        description: "Proposal updated successfully",
      });

      onComplete();
    } catch (error) {
      console.error("Error editing proposal:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update proposal",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Proposal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-translation">Translation</Label>
            <Textarea
              id="edit-translation"
              placeholder="Enter your translation..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-note">Note (Optional)</Label>
            <Textarea
              id="edit-note"
              placeholder="Add any notes or context about your translation..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
