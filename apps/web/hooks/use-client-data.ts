"use client";

import {
  getCookie,
  setCookie,
  deleteCookie,
  hasCookie,
  OptionsType,
} from "cookies-next/client";

// Cookie consent key in localStorage
export const COOKIE_CONSENT_KEY = "cookie-consent-preferences";

// Cookie types
export enum CookieType {
  NECESSARY = "necessary",
  FUNCTIONAL = "functional",
}

// Storage types
export type StorageType = "cookie" | "localStorage";

// Data item interface
export interface DataItem {
  key: string;
  type: CookieType;
  storage: StorageType;
  expiry?: number; // Days for cookies, not used for localStorage
  description?: string;
}

// Client Data Manager
class ClientDataManager {
  private registeredItems: Map<string, DataItem>;
  private consentPreferences: Record<string, boolean> | null = null;

  constructor() {
    this.registeredItems = new Map();
    this.loadConsentPreferences();
  }

  /**
   * Load user consent preferences from localStorage
   */
  private loadConsentPreferences(): void {
    if (typeof window === "undefined") return;

    try {
      const preferences = localStorage.getItem(COOKIE_CONSENT_KEY);
      this.consentPreferences = preferences ? JSON.parse(preferences) : null;
    } catch (error) {
      console.error("Failed to load consent preferences:", error);
      this.consentPreferences = null;
    }
  }

  /**
   * Check if a specific cookie type is allowed
   */
  public isTypeAllowed(type: CookieType): boolean {
    // Necessary cookies are always allowed
    if (type === CookieType.NECESSARY) return true;

    // If no preferences are set, only allow necessary cookies
    if (!this.consentPreferences) return false;

    return !!this.consentPreferences[type];
  }

  /**
   * Validate a data item
   */
  private validateItem(item: DataItem): boolean {
    // Check required fields
    if (!item.key || typeof item.key !== "string") {
      console.error("Data item must have a valid key");
      return false;
    }

    // Check type
    if (!Object.values(CookieType).includes(item.type)) {
      console.error(`Invalid cookie type: ${item.type}`);
      return false;
    }

    // Check storage
    if (item.storage !== "cookie" && item.storage !== "localStorage") {
      console.error(`Invalid storage type: ${item.storage}`);
      return false;
    }

    // Check expiry if provided
    if (
      item.expiry !== undefined &&
      (typeof item.expiry !== "number" || item.expiry <= 0)
    ) {
      console.error("Expiry must be a positive number");
      return false;
    }

    return true;
  }

  /**
   * Register a data item with the manager
   */
  public registerItem(item: DataItem): void {
    if (this.validateItem(item)) {
      this.registeredItems.set(item.key, item);
    }
  }

  /**
   * Register multiple data items at once
   */
  public registerItems(items: DataItem[]): void {
    items.forEach((item) => this.registerItem(item));
  }

  /**
   * Get a value from storage
   */
  public get<T>(key: string): T | null {
    const item = this.registeredItems.get(key);

    if (!item) {
      console.warn(`Data item "${key}" is not registered`);
      return null;
    }

    if (!this.isTypeAllowed(item.type)) {
      console.info(
        `Access to "${key}" denied due to cookie consent preferences`,
      );
      return null;
    }

    try {
      if (item.storage === "cookie") {
        const value = getCookie(key);
        return value ? (JSON.parse(value as string) as T) : null;
      } else {
        const value = localStorage.getItem(key);
        return value ? (JSON.parse(value) as T) : null;
      }
    } catch (error) {
      console.error(`Error retrieving "${key}":`, error);
      return null;
    }
  }

  /**
   * Set a value in storage
   */
  public set<T>(key: string, value: T): boolean {
    const item = this.registeredItems.get(key);

    if (!item) {
      console.warn(`Data item "${key}" is not registered`);
      return false;
    }

    if (!this.isTypeAllowed(item.type)) {
      console.info(`Setting "${key}" denied due to cookie consent preferences`);
      return false;
    }

    try {
      const stringValue = JSON.stringify(value);

      if (item.storage === "cookie") {
        const options: OptionsType = { sameSite: "strict" };
        if (item.expiry) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + item.expiry);
          options.expires = expiryDate;
        }
        setCookie(key, stringValue, options);
      } else {
        localStorage.setItem(key, stringValue);
      }
      return true;
    } catch (error) {
      console.error(`Error setting "${key}":`, error);
      return false;
    }
  }

  /**
   * Check if a value exists in storage
   */
  public has(key: string): boolean {
    const item = this.registeredItems.get(key);

    if (!item) {
      console.warn(`Data item "${key}" is not registered`);
      return false;
    }

    if (!this.isTypeAllowed(item.type)) {
      return false;
    }

    try {
      if (item.storage === "cookie") {
        return hasCookie(key);
      } else {
        return localStorage.getItem(key) !== null;
      }
    } catch (error) {
      console.error(`Error checking "${key}":`, error);
      return false;
    }
  }

  /**
   * Delete a value from storage
   */
  public delete(key: string): boolean {
    const item = this.registeredItems.get(key);

    if (!item) {
      console.warn(`Data item "${key}" is not registered`);
      return false;
    }

    if (!this.isTypeAllowed(item.type)) {
      console.info(
        `Deleting "${key}" denied due to cookie consent preferences`,
      );
      return false;
    }

    try {
      if (item.storage === "cookie") {
        deleteCookie(key);
      } else {
        localStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error(`Error deleting "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all values of a specific type
   */
  public clearByType(type: CookieType): void {
    if (!this.isTypeAllowed(type)) {
      console.info(
        `Clearing type "${type}" denied due to cookie consent preferences`,
      );
      return;
    }

    this.registeredItems.forEach((item, key) => {
      if (item.type === type) {
        if (item.storage === "cookie") {
          deleteCookie(key);
        } else {
          localStorage.removeItem(key);
        }
      }
    });
  }

  /**
   * Update consent preferences and handle data cleanup
   */
  public updateConsentPreferences(preferences: Record<string, boolean>): void {
    const previousPreferences = this.consentPreferences || {};
    this.consentPreferences = preferences;

    // Save the new preferences
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));

    // Clean up data for revoked consent
    Object.entries(previousPreferences).forEach(([type, wasAllowed]) => {
      const isNowAllowed = preferences[type];

      // If consent was revoked, clear all data of this type
      if (wasAllowed && !isNowAllowed) {
        this.clearByType(type as CookieType);
      }
    });
  }

  /**
   * Get all registered items
   */
  public getRegisteredItems(): DataItem[] {
    return Array.from(this.registeredItems.values());
  }
}

// Create a singleton instance
export const clientData = new ClientDataManager();

// Export a hook for React components
export function useClientData() {
  return clientData;
}
