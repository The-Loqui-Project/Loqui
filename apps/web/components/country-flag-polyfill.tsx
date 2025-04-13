"use client";

import { useEffect } from "react";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

export function CountryFlagPolyfill() {
  useEffect(() => {
    // Initialize the polyfill on the client side
    polyfillCountryFlagEmojis();
  }, []);

  // This component doesn't render anything
  return null;
}
