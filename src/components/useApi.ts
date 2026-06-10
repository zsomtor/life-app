"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const REFRESH_EVENT = "life:refresh";

/** Ask every useApi hook on the page to refetch (after a mutation). */
export function broadcastRefresh() {
  window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
}

/**
 * Tiny fetch hook with polling + global refresh events.
 * Polling pauses while the tab is hidden to stay battery/quota friendly.
 */
export function useApi<T>(path: string, intervalMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathRef = useRef(path);
  pathRef.current = path;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(pathRef.current, { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as T);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(REFRESH_EVENT, refresh);
    let timer: ReturnType<typeof setInterval> | undefined;
    if (intervalMs > 0) {
      timer = setInterval(() => {
        if (document.visibilityState === "visible") refresh();
      }, intervalMs);
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(REFRESH_EVENT, refresh);
      document.removeEventListener("visibilitychange", onVisible);
      if (timer) clearInterval(timer);
    };
  }, [refresh, intervalMs]);

  return { data, error, loading, refresh };
}

/** JSON mutation helper; throws on non-2xx. */
export async function api(path: string, method: string, body?: unknown): Promise<unknown> {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `HTTP ${res.status}`);
  }
  return res.json().catch(() => null);
}
