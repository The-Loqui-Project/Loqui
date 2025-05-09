"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  clientData,
  COOKIE_CONSENT_KEY,
  CookieType,
} from "@/hooks/use-client-data";

// Cookie types and their descriptions
export const COOKIE_TYPE_DEFINITIONS: {
  [K in CookieType]: {
    id: CookieType;
    name: string;
    description: string;
    required: boolean;
    defaultEnabled: boolean;
  };
} = {
  [CookieType.NECESSARY]: {
    id: CookieType.NECESSARY,
    name: "Necessary",
    description:
      "Essential cookies that enable basic functionality of the website (eg. your access token).",
    required: true,
    defaultEnabled: true,
  },
  [CookieType.FUNCTIONAL]: {
    id: CookieType.FUNCTIONAL,
    name: "Functional",
    description:
      "Cookies that enhance the functionality of the website, such as remembering your preferences (eg. the selected theme).",
    required: false,
    defaultEnabled: false,
  },
};

export function CookieManager() {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const storedPreferences = localStorage.getItem(COOKIE_CONSENT_KEY);

    if (storedPreferences) {
      setPreferences(JSON.parse(storedPreferences));
    } else {
      // Default to only necessary cookies if no preferences are saved
      const defaultPreferences = Object.keys(COOKIE_TYPE_DEFINITIONS).reduce(
        (acc, key) => {
          acc[key] = key === CookieType.NECESSARY;
          return acc;
        },
        {} as Record<string, boolean>,
      );

      setPreferences(defaultPreferences);
    }

    setIsLoaded(true);
  }, []);

  // Update a specific preference
  const updatePreference = (id: string, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Save preferences
  const savePreferences = () => {
    clientData.updateConsentPreferences(preferences);
  };

  // Accept all cookies
  const acceptAll = () => {
    const allAccepted = Object.keys(COOKIE_TYPE_DEFINITIONS).reduce(
      (acc, key) => {
        acc[key] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );

    setPreferences(allAccepted);
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Cookie Settings</CardTitle>
        <CardDescription>Manage your cookie preferences here.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {Object.entries(COOKIE_TYPE_DEFINITIONS).map(([key, cookie]) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <Label htmlFor={cookie.id} className="flex flex-col gap-1">
              <span>
                {cookie.name}{" "}
                {cookie.required && (
                  <span className="text-xs text-muted-foreground">
                    (Required)
                  </span>
                )}
              </span>
              <span className="font-normal leading-snug text-muted-foreground">
                {cookie.description}
              </span>
            </Label>
            <Switch
              id={cookie.id}
              checked={preferences[key]}
              onCheckedChange={(checked) => updatePreference(key, checked)}
              disabled={cookie.required}
            />
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={acceptAll}
        >
          Accept All
        </Button>
        <Button className="w-full sm:w-auto" onClick={savePreferences}>
          Save Preferences
        </Button>
      </CardFooter>
    </Card>
  );
}
