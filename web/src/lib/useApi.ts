import { useCallback, useEffect, useRef, useState } from 'react';
import { onInvalidate } from './bus';

export interface UseApiResult<T> {
  data: T | null;
  error: unknown;
  loading: boolean;
  retry: () => void;
}

export interface UseApiOptions {
  /** Invalidate-bus resources that trigger an automatic refetch. */
  watch?: readonly string[];
}

/**
 * Hand-rolled data-fetching hook (no external state library — the app's
 * server state is a handful of independent GETs, which this covers with
 * loading/error/retry + SSE-driven refetch).
 *
 * `deps` controls when the fetch re-runs (like useEffect deps). `retry()`
 * forces a refetch. While a refetch is in flight the previous data stays
 * rendered; renderers gate skeletons on `loading && !data`.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[] = [],
  opts: UseApiOptions = {},
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const watchKey = opts.watch?.join('|') ?? '';

  useEffect(() => {
    if (!watchKey) return;
    const names = watchKey.split('|');
    return onInvalidate((resource) => {
      if (names.includes(resource)) setTick((t) => t + 1);
    });
  }, [watchKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // deps is caller-controlled, mirroring useEffect semantics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const retry = useCallback(() => setTick((t) => t + 1), []);

  return { data, error, loading, retry };
}
