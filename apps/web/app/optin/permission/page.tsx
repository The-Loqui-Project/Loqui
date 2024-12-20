"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function Page() {
  return (
    <Suspense>
      <OptInBenefitsPage />
    </Suspense>
  );
}

function OptInBenefitsPage() {
  const [checked, setChecked] = useState(false);
  const params = useSearchParams();
  const PROJECT_NAME = params.get("project");
  return (
    <div className="w-svw h-svh flex">
      <Card className="m-auto p-8">
        <div className="flex flex-col max-w-[80ch] w-fit gap-4">
          <h1 className="font-bold text-2xl mx-auto">Terms of Service</h1>

          <p>
            By checking this box, you grant permission for Loqui to download and
            extract the necessary files from the versions of your Modrinth
            project (&lsquo;{PROJECT_NAME}&rsquo;). You also authorize Loqui to
            scrape, store, and process all en_us.json translation files included
            in your project (&lsquo;{PROJECT_NAME}&rsquo;), regardless of their
            license. You affirm that you have the necessary rights to grant this
            permission for all files included in your project (&lsquo;
            {PROJECT_NAME}&rsquo;).
          </p>

          <div className="items-top flex space-x-2">
            <Checkbox
              id="terms"
              checked={checked}
              onClick={() => setChecked(!checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Accept Terms of Service
              </label>
            </div>
          </div>

          <Link href="/optin/confirm" className="mx-auto">
            <Button disabled={!checked}>Continue</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
