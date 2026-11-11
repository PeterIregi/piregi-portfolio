"use client";

import Link from "next/link";
import { useMediaAssets } from "./use-media-assets";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  emptyMessage?: string;
};

export function MediaPicker({ value, onChange, label = "Bio Photo", emptyMessage = "No image selected" }: Props) {
  const { assets, loading, error, reload } = useMediaAssets();

  const selected = assets.find((a) => a.id === value);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-ink">{label}</label>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/admin/media" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-deep">
            Upload or manage
          </Link>
          <button type="button" onClick={reload} className="text-graphite hover:text-ink">
            Refresh
          </button>
        </div>
      </div>
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
                aria-pressed={asset.id === value}
                aria-label={`Use image: ${asset.altText ?? asset.id}`}
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
