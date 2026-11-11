"use client";

import { useCallback, useEffect, useState } from "react";

export type MediaAsset = {
  id: string;
  publicUrl: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

/**
 * Loads the media library for the admin pickers. `reload` exists because an
 * upload happens on /admin/media in another tab or after a client-side
 * navigation, so a picker that stays mounted would otherwise keep showing the
 * list it fetched on mount.
 */
export function useMediaAssets() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/media");
        if (!res.ok) throw new Error("Failed to load media");
        const data = await res.json();
        if (active) setAssets(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load media");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return { assets, loading, error, reload };
}
