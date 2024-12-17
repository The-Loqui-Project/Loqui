import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ModrinthIcon from "@/components/ui/icons/modrinthIcon";
import Link from "next/link";

export default function AuthPage() {
  function setupModrinthAuth() {}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Authenticating with Modrinth
          </CardTitle>
          <CardDescription className="text-center">
            We're about to send you to Modrinth, if you're not automatically
            redirected, click the button below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Button asChild className="bg-green-500 hover:bg-green-500">
              <Link href="/api/auth/modrinth">
                <ModrinthIcon width={24} height={24} /> Continue to Modrinth
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
