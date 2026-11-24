import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { ApiError, apiRequest } from './api';

const TOKEN_KEY = 'dream-app.session';
const isNative = Platform.OS !== 'web';

type SessionContextValue = {
  signedIn: boolean;
  restoring: boolean;
  restoreError: boolean;
  restore: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState(false);

  async function restore() {
    setRestoring(true);
    setRestoreError(false);
    try {
      if (!isNative) return;
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!storedToken) return;

      // The API has no separate endpoint to check a session.
      try {
        await apiRequest('/expenses', { token: storedToken });
        setToken(storedToken);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {
      setRestoreError(true);
    } finally {
      setRestoring(false);
    }
  }

  useEffect(() => {
    void restore();
  }, []);

  async function signIn(email: string, password: string) {
    const result = await apiRequest<{ token: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (typeof result.token !== 'string' || !result.token) {
      throw new Error('Inloggningssvaret saknar en session.');
    }
    if (isNative) await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    setToken(result.token);
  }

  async function signOut() {
    if (isNative) await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
  }

  return (
    <SessionContext.Provider
      value={{ signedIn: token !== null, restoring, restoreError, restore, signIn, signOut }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionProvider saknas.');
  return session;
}
