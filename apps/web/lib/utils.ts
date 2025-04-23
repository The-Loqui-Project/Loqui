import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Capitalizes the first letter of a string
 * @param str The string to capitalize
 * @returns The string with the first letter capitalized
 */
export function capitalizeFirstLetter(str: string) {
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

/**
 * Map of language codes that need special emoji overrides
 * Used for languages that don't conform to the xx_XX pattern
 * or need a special representation
 */
export const languageFlagOverrides: Record<string, string> = {
  // Languages without a country code
  bar: "🍺", // Bavarian - beer mug
  brb: "🇳🇱", // Brabantian - Netherlands
  enp: "📚", // Anglish - book
  enws: "🎭", // Early Modern English/Shakespearean - theater masks
  esan: "🇪🇸", // Andalusian - Spain
  fra_de: "🇩🇪", // East Franconian - Germany
  isv: "🌍", // Interslavic - globe
  ksh: "🇩🇪", // Kölsch/Ripuarian - Germany
  lmo: "🇮🇹", // Lombard - Italy
  lzh: "🇨🇳", // Literary Chinese - China
  nah: "🇲🇽", // Nahuatl - Mexico
  ovd: "🇸🇪", // Elfdalian - Sweden
  rpr: "🇷🇺", // Russian (Pre-revolutionary) - Russia
  sxu: "🇩🇪", // Upper Saxon German - Germany
  szl: "🇵🇱", // Silesian - Poland
  tok: "🌟", // Toki Pona - star
  vp_vl: "🌐", // Viossa - globe with meridians

  // Fictional or constructed languages
  qya_aa: "💍", // Quenya (LOTR Elvish) - ring
  tlh_aa: "🖖", // Klingon - Vulcan salute
  jbo_en: "🧩", // Lojban - puzzle piece
  io_en: "🌐", // Ido - globe with meridians

  // Special cases
  "?poplca": "🇲🇽", // Popoloca - Mexico
  en_pt: "🏴‍☠️", // Pirate English - skull and crossbones
  en_ud: "🙃", // Upside down English - upside down face
  lol_us: "😹", // LOLCAT - cat with tears of joy
};

/**
 * Converts a locale code (e.g., "en_US", "de_DE") to a country flag emoji
 * @param localeCode The locale code in format "xx_XX" where XX is the country code
 * @returns The country flag emoji for the given locale
 */
export function getCountryFlag(localeCode: string): string {
  // Check if we have an override for this locale code
  if (languageFlagOverrides[localeCode]) {
    return languageFlagOverrides[localeCode];
  }

  // Return empty string if localeCode is falsy or not a string
  if (!localeCode || typeof localeCode !== "string") {
    return "";
  }

  try {
    // Extract the region code from a locale like "en_US" -> "US"
    const regionParts: string[] = localeCode.split("_");

    // If there's no region part, or it's too short, return empty string
    if (regionParts.length < 2 || regionParts[1]!.length < 2) {
      return "";
    }

    const region = regionParts[1]!.toUpperCase();

    // Convert region code characters to regional indicator symbols
    // Each regional indicator symbol is created by adding the code point offset (127397)
    // to the character code of the letter
    return String.fromCodePoint(
      ...region.split("").map((char) => 127397 + char.charCodeAt(0)),
    );
  } catch (e) {
    console.error("Error generating country flag:", e);
    return "";
  }
}
