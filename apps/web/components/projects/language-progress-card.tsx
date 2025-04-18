import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Globe } from "lucide-react";
import { Language } from "@/lib/api-client";

interface LanguageProgressCardProps {
  language: Language;
  progress?: {
    total: number;
    translated: number;
    progress: number;
  };
  onClick: () => void;
}

export default function LanguageProgressCard({
  language,
  progress,
  onClick,
}: LanguageProgressCardProps) {
  const progressPercentage = progress?.progress
    ? Math.round(progress.progress * 100)
    : 0;
  const translatedCount = progress?.translated || 0;
  const totalCount = progress?.total || 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/40">
        <CardTitle className="flex items-center">
          <Globe className="mr-2 h-5 w-5" />
          <span>{language.name}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{language.nativeName}</p>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex justify-between mb-2 text-sm">
          <span>Progress</span>
          <span className="font-medium">{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <p className="mt-2 text-sm text-muted-foreground">
          {translatedCount} / {totalCount} strings translated
        </p>
      </CardContent>
      <CardFooter className="bg-muted/20 px-6 py-3 border-t">
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={onClick}
        >
          <span>Translate</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
