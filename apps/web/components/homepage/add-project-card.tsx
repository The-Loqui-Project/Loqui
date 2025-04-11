"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddProjectCardProps {
  onClick?: () => void;
}

export function AddProjectCard({ onClick }: AddProjectCardProps) {
  return (
    <Card
      className="border-dashed border-2 flex flex-col items-center justify-center p-6 h-[250px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors"
      onClick={onClick}
    >
      <Button variant="ghost" className="h-20 w-20 rounded-full">
        <Plus className="h-10 w-10 text-muted-foreground" />
      </Button>
      <p className="mt-4 font-medium">Add New Project</p>
    </Card>
  );
}
