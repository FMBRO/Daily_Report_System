"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import type { User, AuthTokens } from "@/types/auth";

const TOKEN_KEY = "daily_report_tokens";
const USER_KEY = "daily_report_user";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface UseAuthReturn extends AuthState {
  login: (tokens: AuthTokens, user: User) => void;
  logout: () => void;
  getAccessToken: () => string | null;
  refreshToken: () => Promise<boolean>;
}

function getStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredTokens(tokens: AuthTokens | null): void {
  if (typeof window === "undefined") {
    return;
  }
  if (tokens) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function setStoredUser(user: User | null): void {
  if (typeof window === "undefined") {
    return;
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

// For useSyncExternalStore
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): AuthState {
  const tokens = getStoredTokens();
  const user = getStoredUser();

  if (tokens && user) {
    return {
      user,
      isAuthenticated: true,
      isLoading: false,
    };
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  };
}

function getServerSnapshot(): AuthState {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  };
}

export function useAuth(): UseAuthReturn {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [, forceUpdate] = useState({});

  const login = useCallback((tokens: AuthTokens, user: User) => {
    setStoredTokens(tokens);
    setStoredUser(user);
    emitChange();
    forceUpdate({});
  }, []);

  const logout = useCallback(() => {
    setStoredTokens(null);
    setStoredUser(null);
    emitChange();
    forceUpdate({});
  }, []);

  const getAccessToken = useCallback((): string | null => {
    const tokens = getStoredTokens();
    return tokens?.accessToken ?? null;
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const tokens = getStoredTokens();
    if (!tokens?.refreshToken) {
      logout();
      return false;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        logout();
        return false;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setStoredTokens(data.data.tokens);
        emitChange();
        forceUpdate({});
        return true;
      }

      logout();
      return false;
    } catch {
      logout();
      return false;
    }
  }, [logout]);

  return {
    ...state,
    login,
    logout,
    getAccessToken,
    refreshToken,
  };
}
