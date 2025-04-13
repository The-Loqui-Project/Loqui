interface ProgressPanelProps {
  completionPercentage: number;
}

export default function ProgressPanel({
  completionPercentage,
}: ProgressPanelProps) {
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

      {/* Instructions panel */}
      <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
        <p className="font-medium mb-1">Translation Process:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Review existing proposals or create a new one</li>
          <li>Vote on proposals you agree with</li>
          <li>
            The proposal with the most votes will become the official
            translation
          </li>
        </ol>
      </div>
    </>
  );
}
