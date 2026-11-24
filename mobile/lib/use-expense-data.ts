import { useEffect, useState } from 'react';
import { ApiError } from './api';
import { useSession } from './session';

type Result<T> =
  | { status: 'loading' }
  | { status: 'error'; notFound: boolean }
  | { status: 'success'; data: T };

export function useExpenseData<T>(path: string | null) {
  const { request } = useSession();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ path: string; value: Result<T> } | null>(null);

  useEffect(() => {
    if (!path) return;

    const controller = new AbortController();
    request<T>(path, { signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ path, value: { status: 'success', data } });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            path,
            value: { status: 'error', notFound: error instanceof ApiError && error.status === 404 },
          });
        }
      },
    );

    return () => controller.abort();
  }, [attempt, path, request]);

  function retry() {
    setResult(null);
    setAttempt((value) => value + 1);
  }

  const state: Result<T> = result && result.path === path ? result.value : { status: 'loading' };
  return { state, retry };
}
