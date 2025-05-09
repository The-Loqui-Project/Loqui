"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { clientData, COOKIE_CONSENT_KEY } from "@/hooks/use-client-data";
import { COOKIE_TYPE_DEFINITIONS } from "@/components/cookie/cookie-manager";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    // Initialize with default values
    return Object.entries(COOKIE_TYPE_DEFINITIONS).reduce(
      (acc, [key, value]) => {
        acc[key] = value.defaultEnabled;
        return acc;
      },
      {} as Record<string, boolean>,
    );
  });

  // Check if user has already set cookie preferences
  useEffect(() => {
    const storedPreferences = localStorage.getItem(COOKIE_CONSENT_KEY);

    if (storedPreferences) {
      setPreferences(JSON.parse(storedPreferences));
    } else {
      setShowBanner(true);
    }
  }, []);

  // Save preferences to localStorage and update clientData
  const savePreferences = (newPreferences: Record<string, boolean>) => {
    clientData.updateConsentPreferences(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    setShowPreferences(false);
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

    savePreferences(allAccepted);
  };

  // Accept only necessary cookies
  const acceptNecessary = () => {
    const necessaryOnly = Object.entries(COOKIE_TYPE_DEFINITIONS).reduce(
      (acc, [key, value]) => {
        acc[key] = value.required;
        return acc;
      },
      {} as Record<string, boolean>,
    );

    savePreferences(necessaryOnly);
  };

  // Update a specific preference
  const updatePreference = (id: string, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Save current preferences
  const saveCurrentPreferences = () => {
    savePreferences(preferences);
  };

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && (
        <>
          {/* Overlay with blur effect */}
          <div
            className="fixed inset-0 bg-background/40 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Centered banner */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl">
              <Card className="shadow-lg border-primary/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Cookie Preferences</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowBanner(false)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </div>
                  <CardDescription>
                    We use cookies to enhance your browsing experience, and make
                    this site usable. By clicking &quot;Accept All&quot;, you
                    consent to our use of cookies.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col sm:flex-row gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreferences(true)}
                  >
                    Customize
                  </Button>
                  <Button variant="outline" onClick={acceptNecessary}>
                    Accept Necessary
                  </Button>
                  <Button onClick={acceptAll}>Accept All</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Cookie Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cookie Settings</DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. Required cookies are necessary for
              basic website functionality.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {Object.entries(COOKIE_TYPE_DEFINITIONS).map(([key, cookie]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <Label htmlFor={cookie.id} className="text-base">
                    {cookie.name}{" "}
                    {cookie.required && (
                      <span className="text-xs text-muted-foreground">
                        (Required)
                      </span>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {cookie.description}
                  </p>
                </div>
                <Switch
                  id={cookie.id}
                  checked={preferences[key]}
                  onCheckedChange={(checked) => updatePreference(key, checked)}
                  disabled={cookie.required}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreferences(false)}>
              Cancel
            </Button>
            <Button onClick={saveCurrentPreferences}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
