import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from './api';
import {
  getBaseUrl as loadBaseUrl,
  getToken,
  resetTracker,
  setBaseUrl as saveBaseUrl,
  setToken,
} from './storage';
import { UserRead } from './types';

interface AppState {
  isReady: boolean;
  baseUrl: string | null;
  user: UserRead | null;
  setServerUrl: (url: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [baseUrl, setBaseUrlState] = useState<string | null>(null);
  const [user, setUser] = useState<UserRead | null>(null);

  useEffect(() => {
    (async () => {
      const storedUrl = await loadBaseUrl();
      setBaseUrlState(storedUrl);
      const token = await getToken();
      if (storedUrl && token) {
        try {
          setUser(await api.getMe());
        } catch {
          await setToken(null);
        }
      }
      setIsReady(true);
    })();
  }, []);

  const signOut = useCallback(async () => {
    await setToken(null);
    await resetTracker();
    setUser(null);
  }, []);

  // Expired/invalid token anywhere -> drop back to login.
  useEffect(() => api.onUnauthorized(() => void signOut()), [signOut]);

  const setServerUrl = useCallback(async (url: string) => {
    await saveBaseUrl(url);
    setBaseUrlState(url.replace(/\/+$/, ''));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const token = await api.login(email.trim(), password);
    await setToken(token.access_token);
    await resetTracker(); // fresh seed on next poll — no notification storm
    setUser(await api.getMe());
  }, []);

  const signUp = useCallback(
    async (fullName: string, email: string, password: string) => {
      await api.signup(fullName.trim(), email.trim(), password);
      await signIn(email, password);
    },
    [signIn],
  );

  const value = useMemo(
    () => ({ isReady, baseUrl, user, setServerUrl, signIn, signUp, signOut }),
    [isReady, baseUrl, user, setServerUrl, signIn, signUp, signOut],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
