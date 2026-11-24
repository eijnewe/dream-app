import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { ApiError, apiRequest, type ApiOptions } from './api';

const TOKEN_KEY = 'dream-app.session';
const isNative = Platform.OS !== 'web';

type SessionContextValue = {
  signedIn: boolean;
  restoring: boolean;
  restoreError: boolean;
  restore: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  request: <T>(path: string, options?: ApiOptions) => Promise<T>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState(false);
  const activeToken = useRef<string | null>(null);
  const signingOut = useRef<Promise<void> | null>(null);

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
        activeToken.current = storedToken;
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
    activeToken.current = result.token;
    setToken(result.token);
  }

  const signOut = useCallback(() => {
    signingOut.current ??= (async () => {
      if (isNative) await SecureStore.deleteItemAsync(TOKEN_KEY);
      activeToken.current = null;
      setToken(null);
    })().finally(() => {
      signingOut.current = null;
    });
    return signingOut.current;
  }, []);

  const request = useCallback(async <T,>(path: string, options?: ApiOptions) => {
    if (!token) throw new ApiError(401);

    try {
      return await apiRequest<T>(path, { ...options, token });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && activeToken.current === token) {
        await signOut();
      }
      throw error;
    }
  }, [signOut, token]);

  return (
    <SessionContext.Provider
      value={{ signedIn: token !== null, restoring, restoreError, restore, signIn, signOut, request }}
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
