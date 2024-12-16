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
        <div className="flex flex-col max-w-[80ch] w-fit">
          <h1 className="font-bold text-2xl mx-auto">Benefits of Opting In</h1>

          <div className="grid lg:grid-cols-3 gap-8 my-16 md:grid-cols-1">
            <Feature
              icon={<Clock />}
              header="Save Time"
              body="Loqui handles all the hard work of managing translations so you can focus on developing your mod."
            />

            <Feature
              icon={<Globe2 />}
              header="Reach More Players"
              body="Translations make your mod accessible to players around the world."
            />

            <Feature
              icon={<ChartLine />}
              header="Grow Your Mod's Popularity"
              body="Localized mods attract more users and stand out in the community."
            />
          </div>

          <Link href="/optin/permission" className="mx-auto">
            <Button>Continue</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
