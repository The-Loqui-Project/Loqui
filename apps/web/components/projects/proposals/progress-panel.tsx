import { useLocalStoragePreference } from "@/hooks/use-local-storage-preference";

interface ProgressPanelProps {
  completionPercentage: number;
}

export default function ProgressPanel({
  completionPercentage,
}: ProgressPanelProps) {
  const [showInstructions, setShowInstructions] = useLocalStoragePreference(
    "hideTranslationInstructions",
    true,
  );

  const handleHideInstructions = () => {
    setShowInstructions(false);
  };

  return (
    <>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Translation Progress</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Instructions panel - only shown if showInstructions is true */}
      {showInstructions === true && (
        <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
          <div className="flex justify-between items-start mb-1">
            <p className="font-medium">Translation Process:</p>
            <button
              onClick={handleHideInstructions}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Don&apos;t show this again
            </button>
          </div>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Review existing proposals or create a new one</li>
            <li>
              Vote on proposals you agree with and downvote proposals you
              don&apos;t agree with.
            </li>
            <li>
              The proposal with the most votes, and an overall score greater
              than or equal to zero, will become the official translation.
            </li>
          </ol>
        </div>
      )}
    </>
  );
}
