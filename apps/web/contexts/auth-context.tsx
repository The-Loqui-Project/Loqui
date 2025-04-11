"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import {
  getCookie,
  setCookie,
  deleteCookie,
  hasCookie,
} from "cookies-next/client";

interface AuthUser {
  username: string;
  // Add other user properties as needed
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, expiration: number, userData: any) => void;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if the token exists and is valid
  const checkAuthStatus = () => {
    setIsLoading(true);

    try {
      const hasToken = hasCookie("token");

      if (!hasToken) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      const tokenExpiration = getCookie("token_expiration");
      const isExpired = tokenExpiration
        ? Number.parseInt(tokenExpiration.toString()) < Date.now()
        : true;

      if (isExpired) {
        // Token is expired, log the user out
        handleLogout();
        setIsLoading(false);
        return;
      }

      // If we have a valid token, try to get user data
      const username = getCookie("username");

      if (username) {
        setUser({ username: username.toString() });
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setUser(null);
    }

    setIsLoading(false);
  };

  // Login function
  const handleLogin = (token: string, expiration: number, userData: any) => {
    // Convert the expiration (seconds from now) to an absolute timestamp
    const expirationTimestamp = Date.now() + expiration * 1000;

    // Cookie options for better persistence
    const cookieOptions = {
      maxAge: expiration, // Max age in seconds
      path: "/", // Available across the entire site
      sameSite: "strict" as const, // Enhances security
      secure: process.env.NODE_ENV === "production", // Secure in production
    };

    setCookie("token", token, cookieOptions);
    setCookie(
      "token_expiration",
      expirationTimestamp.toString(),
      cookieOptions,
    );
    setCookie("username", userData.username, cookieOptions);

    // You can store additional user data in cookies if needed
    // setCookie("user_id", userData.id, cookieOptions);

    setUser({ username: userData.username });
    setIsAuthenticated(true);
  };

  // Logout function
  const handleLogout = () => {
    // Use consistent options for deletion
    const cookieOptions = {
      path: "/",
      sameSite: "strict" as const,
      secure: process.env.NODE_ENV === "production",
    };

    deleteCookie("token", cookieOptions);
    deleteCookie("token_expiration", cookieOptions);
    deleteCookie("username", cookieOptions);

    // Delete any other user-related cookies
    setUser(null);
    setIsAuthenticated(false);
  };

  // Refresh authentication - useful when you need to check if the session is still valid
  const refreshAuth = async (): Promise<boolean> => {
    setIsLoading(true);

    try {
      // You could make an API call here to validate the token with your backend
      const hasToken = hasCookie("token");

      if (!hasToken) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return false;
      }

      const tokenExpiration = getCookie("token_expiration");
      const isExpired = tokenExpiration
        ? Number.parseInt(tokenExpiration.toString()) < Date.now()
        : true;

      if (isExpired) {
        handleLogout();
        setIsLoading(false);
        return false;
      }

      // If we have a valid token, refresh user data if needed
      const username = getCookie("username");

      if (username) {
        setUser({ username: username.toString() });
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error("Error refreshing auth:", error);
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  // Check auth status on mount and set up focus event listener
  useEffect(() => {
    checkAuthStatus();

    // Also check auth status when the window regains focus
    const handleFocus = () => {
      checkAuthStatus();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const value = {
    isAuthenticated,
    user,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
