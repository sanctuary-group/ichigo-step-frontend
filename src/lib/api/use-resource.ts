"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State<T> = {
  data: T | undefined;
  error: unknown;
  isLoading: boolean;
};

/**
 * 最小限のデータ取得フック。key が変わると再フェッチ。
 * 将来 SWR / TanStack Query へ差し替える継ぎ目。
 *
 * @param key  キャッシュ/再フェッチのトリガー。null なら取得しない。
 * @param fetcher 取得関数
 */
export function useResource<T>(
  key: string | null,
  fetcher: () => Promise<T>,
): State<T> & { mutate: () => void } {
  const [state, setState] = useState<State<T>>({
    data: undefined,
    error: undefined,
    isLoading: key !== null,
  });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [tick, setTick] = useState(0);
  const mutate = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (key === null) {
      setState({ data: undefined, error: undefined, isLoading: false });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, error: undefined, isLoading: false });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: undefined, error, isLoading: false });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  return { ...state, mutate };
}
