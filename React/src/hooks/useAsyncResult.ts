import { useEffect, useState, useRef } from 'react';

interface UseAsyncResultOptions {
  immediate?: boolean;
}

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAsyncResult<T>(
  factory: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncResultOptions = {}
): AsyncState<T> {
  const { immediate = true } = options;
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const cancelled = useRef(false);
  const version = useRef(0);

  const refresh = () => {
    version.current += 1;
    const currentVersion = version.current;
    setLoading(true);
    setError(null);
    factory()
      .then((result) => {
        if (!cancelled.current && currentVersion === version.current) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled.current && currentVersion === version.current) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      })
      .finally(() => {
        if (!cancelled.current && currentVersion === version.current) {
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    cancelled.current = false;
    if (immediate) {
      refresh();
    }
    return () => {
      cancelled.current = true;
    };
    
  }, deps);

  return { data, loading, error, refresh };
}
