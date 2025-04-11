import type { LucideIcon } from "lucide-react";

interface ActivityItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  timestamp: string;
}

export function ActivityItem({
  icon: Icon,
  title,
  description,
  timestamp,
}: ActivityItemProps) {
  return (
    <div className="p-4 flex items-start gap-4">
      <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
        <Icon className="h-5 w-5 text-emerald-500" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-1">{timestamp}</p>
      </div>
    </div>
  );
}
