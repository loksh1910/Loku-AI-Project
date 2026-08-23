"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthMode = "signin" | "signup";

type AppState = {
  isSignedIn: boolean;
  /** False until localStorage has been read once — lets pages avoid a false
   * "not signed in" redirect on the very first render (a real race: a page's
   * own redirect-check effect can run before this provider's has synced). */
  hydrated: boolean;
  userName: string | null;
  signIn: (name: string) => void;
  signOut: () => void;
  authOpen: boolean;
  authMode: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  setAuthMode: (mode: AuthMode) => void;
};

const STORAGE_KEY = "loku-mock-user";

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthModeState] = useState<AuthMode>("signin");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // Reading localStorage (an external system) on mount and syncing it into
    // React state is exactly what effects are for, despite the lint rule's
    // default heuristic — the value isn't knowable during server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setUserName(stored);
    setHydrated(true);
  }, []);

  const signIn = useCallback((name: string) => {
    const finalName = name.trim() || "there";
    window.localStorage.setItem(STORAGE_KEY, finalName);
    setUserName(finalName);
    setAuthOpen(false);
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUserName(null);
  }, []);

  const openAuth = useCallback((mode: AuthMode = "signin") => {
    setAuthModeState(mode);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);
  const setAuthMode = useCallback((mode: AuthMode) => setAuthModeState(mode), []);

  return (
    <AppStateContext.Provider
      value={{
        isSignedIn: userName !== null,
        hydrated,
        userName,
        signIn,
        signOut,
        authOpen,
        authMode,
        openAuth,
        closeAuth,
        setAuthMode,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
