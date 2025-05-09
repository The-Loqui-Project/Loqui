import { useEffect, useState } from "react";

type UseLocalStoragePreferenceReturn = [
  boolean | null,
  (value: boolean) => void,
];

/**
 * Hook to manage user preferences in localStorage with SSR safety
 * @param key - The localStorage key to use
 * @param defaultValue - Default value to use if no value is stored
 */
export function useLocalStoragePreference(
  key: string,
  defaultValue: boolean = true,
): UseLocalStoragePreferenceReturn {
  // Use null as initial state to indicate "not determined yet"
  const [state, setState] = useState<boolean | null>(null);

  // Initialize the state from localStorage on mount (client-side only)
  useEffect(() => {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null) {
      setState(defaultValue);
    } else {
      setState(storedValue === "true");
    }
  }, [key, defaultValue]);

  // Update localStorage when state changes (but only if it's not null)
  const setPersistedState = (value: boolean) => {
    setState(value);
    localStorage.setItem(key, String(value));
  };

  return [state, setPersistedState];
}
