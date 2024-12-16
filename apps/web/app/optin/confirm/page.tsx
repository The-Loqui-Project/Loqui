import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartLine, Clock, Globe2 } from "lucide-react";
import Link from "next/link";
import { DOMElement, ReactElement } from "react";

function Feature({
  icon,
  header,
  body,
}: {
  icon: ReactElement;
  header: string;
  body: string;
}) {
  return (
    <Card className="p-2 relative">
      <Card className="absolute left-4 top-[-1rem] p-1">{icon}</Card>
      <div className="h-4" />
      <b className="text-lg mt-8">{header}</b>
      <p>{body}</p>
    </Card>
  );
}

export default function OptInBenefitsPage() {
  return (
    <div className="w-svw h-svh flex">
      <Card className="m-auto p-8">
        <div className="flex flex-col max-w-[80ch] w-fit gap-8">
          <h1 className="font-bold text-2xl mx-auto">Thanks!</h1>

          <div className="mx-auto grid grid-cols-2 gap-2">
            <Link href="/optin/permission" className="mx-auto">
              <Button>Join the Discord</Button>
            </Link>
            <Link href="/dashboard" className="mx-auto">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
