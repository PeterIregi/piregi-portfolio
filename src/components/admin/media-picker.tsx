"use client";

import { useEffect, useState } from "react";

type MediaAsset = {
  id: string;
  publicUrl: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  emptyMessage?: string;
};

export function MediaPicker({ value, onChange, label = "Bio Photo", emptyMessage = "No image selected" }: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, []);

  const selected = assets.find((a) => a.id === value);

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-ink">{label}</label>
      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-graphite">Loading...</p>}
      {!loading && !error && (
        <>
          {selected ? (
            <div className="flex items-center gap-4 rounded border border-line bg-paper p-3">
              {selected.publicUrl && (
                <div className="relative h-16 w-16 overflow-hidden rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.publicUrl}
                    alt={selected.altText ?? "Selected media"}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-ink">Selected</p>
                <p className="truncate text-xs text-graphite">{selected.altText ?? selected.id}</p>
              </div>
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-sm text-accent hover:text-accent-deep"
              >
                Clear
              </button>
            </div>
          ) : (
            <p className="text-sm text-graphite">{emptyMessage}</p>
          )}
          <div className="grid max-h-60 grid-cols-4 gap-2 overflow-y-auto rounded border border-line bg-shell p-2 md:grid-cols-6">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => onChange(asset.id)}
                className={`relative h-16 w-full overflow-hidden rounded border transition-colors ${
                  asset.id === value ? "border-accent" : "border-transparent hover:border-edge"
                }`}
                title={asset.altText ?? asset.id}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.publicUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
            {assets.length === 0 && <p className="col-span-full text-xs text-graphite">No media uploaded yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}
