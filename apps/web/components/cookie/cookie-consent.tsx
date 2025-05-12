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
import { clientData } from "@/hooks/use-client-data";
import { COOKIE_TYPE_DEFINITIONS } from "@/components/cookie/cookie-manager";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";

const BUTTON_LABELS = {
  customize: "Customize",
  acceptNecessary: "Accept Necessary",
  acceptAll: "Accept All",
  cancel: "Cancel",
  savePreferences: "Save Preferences",
};

// Common text
const CONTENT = {
  title: "Cookie Preferences",
  description: `We use cookies to improve your browsing experience and ensure the site functions properly. By clicking "${BUTTON_LABELS.acceptAll}", you agree to our use of cookies. Loqui is open source and does not use cookies for tracking.`,
  settingsTitle: "Cookie Settings",
  settingsDescription:
    "Manage your cookie preferences. Required cookies are necessary for basic website functionality.",
  rememberChoiceLabel: "Remember my choice",
  rememberChoiceTooltip:
    "If this is turned on, your cookie consent settings will be remembered even after you close your browser. Else, they'll only be saved temporarily and will be lost when you close the browser.",
  requiredLabel: "(Required)",
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [storeInCookie, setStoreInCookie] = useState(true);
  const isMobile = useIsMobile();
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
    // Try to load preferences from both localStorage and cookie
    const storedPreferences = clientData.loadConsentPreferences();

    if (storedPreferences) {
      setPreferences(storedPreferences);
    } else {
      setShowBanner(true);
    }
  }, []);

  // Handle scrolling when banner is shown
  useEffect(() => {
    if (showBanner) {
      handleScrollLock(true, isMobile);
    } else {
      handleScrollLock(false, isMobile);
    }

    return () => {
      // Ensure scrolling is restored if component unmounts
      handleScrollLock(false, isMobile);
    };
  }, [showBanner, isMobile]);

  // Save preferences to localStorage or cookie based on checkbox
  const savePreferences = (newPreferences: Record<string, boolean>) => {
    if (storeInCookie) {
      clientData.storePreferencesInCookie(newPreferences);
    } else {
      clientData.storePreferencesInLocalStorage(newPreferences);
    }
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
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="w-full max-w-2xl mx-auto my-auto">
              <Card className="shadow-lg border-primary/10 max-h-[90vh] overflow-y-auto mx-2">
                <CardHeader>
                  <CardTitle>{CONTENT.title}</CardTitle>
                  <CardDescription>{CONTENT.description}</CardDescription>
                </CardHeader>
                <CardFooter className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <RememberChoiceCheckbox
                    id="store-in-cookie"
                    checked={storeInCookie}
                    onCheckedChange={(checked) =>
                      setStoreInCookie(checked === true)
                    }
                  />
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreferences(true)}
                      className="flex-1 sm:flex-initial"
                    >
                      {BUTTON_LABELS.customize}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={acceptNecessary}
                      className="flex-1 sm:flex-initial"
                    >
                      {BUTTON_LABELS.acceptNecessary}
                    </Button>
                    <Button
                      onClick={acceptAll}
                      className="flex-1 sm:flex-initial"
                    >
                      {BUTTON_LABELS.acceptAll}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Cookie Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-h-[90vh] rounded-lg">
          <DialogHeader>
            <DialogTitle>{CONTENT.settingsTitle}</DialogTitle>
            <DialogDescription>{CONTENT.settingsDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {Object.entries(COOKIE_TYPE_DEFINITIONS).map(([key, cookie]) => (
              <div
                key={key}
                className="flex flex-row items-start justify-between gap-2 pb-4 border-b last:border-b-0"
              >
                <div className="space-y-1 flex-1 mr-4">
                  <Label htmlFor={cookie.id} className="text-base">
                    {cookie.name}{" "}
                    {cookie.required && (
                      <span className="text-xs text-muted-foreground">
                        {CONTENT.requiredLabel}
                      </span>
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {cookie.description}
                  </p>
                </div>
                <div className="flex-shrink-0 pt-1">
                  <Switch
                    id={cookie.id}
                    checked={preferences[key]}
                    onCheckedChange={(checked) =>
                      updatePreference(key, checked)
                    }
                    disabled={cookie.required}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 pb-4">
            <RememberChoiceCheckbox
              id="store-in-cookie-dialog"
              checked={storeInCookie}
              onCheckedChange={(checked) => setStoreInCookie(checked === true)}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowPreferences(false)}
              className="w-full sm:w-auto mb-2 sm:mb-0"
            >
              {BUTTON_LABELS.cancel}
            </Button>
            <Button
              onClick={saveCurrentPreferences}
              className="w-full sm:w-auto"
            >
              {BUTTON_LABELS.savePreferences}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper component for the "Remember my choice" checkbox with tooltip
function RememberChoiceCheckbox({
  id,
  checked,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-2 sm:mr-auto">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
      />
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Label
            htmlFor={id}
            className="text-sm text-muted-foreground cursor-help"
          >
            {CONTENT.rememberChoiceLabel}
          </Label>
        </HoverCardTrigger>
        <HoverCardContent className="w-64 p-2 text-sm">
          {CONTENT.rememberChoiceTooltip}
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

// Helper function to handle scroll locking/unlocking
function handleScrollLock(lock: boolean, isMobile: boolean) {
  if (lock) {
    // Store current scroll position
    const scrollY = window.scrollY;

    if (isMobile) {
      // For mobile, use a different approach to prevent scrolling issues
      document.body.style.overflow = "hidden";
      document.body.style.height = "100%";
    } else {
      // Desktop approach
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    }
  } else {
    // Restore scrolling
    if (isMobile) {
      document.body.style.overflow = "";
      document.body.style.height = "";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";

      if (scrollY) {
        window.scrollTo(0, Number.parseInt(scrollY || "0", 10) * -1);
      }
    }
  }
}
