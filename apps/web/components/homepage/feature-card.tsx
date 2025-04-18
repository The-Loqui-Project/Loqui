import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonHref: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  features,
  buttonText,
  buttonHref,
}: FeatureCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-emerald-500" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 flex-1">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <a href={buttonHref}>{buttonText}</a>
        </Button>
      </CardFooter>
    </Card>
  );
}
