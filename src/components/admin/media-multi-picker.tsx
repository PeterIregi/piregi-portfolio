"use client";

import Link from "next/link";
import { useMediaAssets } from "./use-media-assets";

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  max?: number;
};

export function MediaMultiPicker({ value, onChange, label = "Gallery Images", max = 24 }: Props) {
  const { assets, loading, error, reload } = useMediaAssets();

  const selected = value.flatMap((id, index) => {
    const asset = assets.find((candidate) => candidate.id === id);
    return asset ? [{ asset, index }] : [];
  });

  const atLimit = value.length >= max;

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((selectedId) => selectedId !== id));
      return;
    }
    if (atLimit) return;
    onChange([...value, id]);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-ink">
          {label} ({value.length}/{max})
        </label>
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
          <div className="flex flex-col gap-2 rounded border border-line bg-paper p-3">
            {selected.length === 0 ? (
              <p className="text-sm text-graphite">No gallery images selected.</p>
            ) : (
              selected.map(({ asset, index }) => (
                <div key={asset.id} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.publicUrl}
                      alt={asset.altText ?? ""}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm text-ink">
                    {asset.altText ?? asset.id}
                  </p>
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${asset.altText ?? asset.id} earlier`}
                    className="text-sm text-graphite hover:text-ink disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === value.length - 1}
                    aria-label={`Move ${asset.altText ?? asset.id} later`}
                    className="text-sm text-graphite hover:text-ink disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(asset.id)}
                    className="text-sm text-accent hover:text-accent-deep"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          {atLimit && (
            <p className="text-xs text-graphite">
              {max} images selected. Remove one before adding another.
            </p>
          )}

          <div className="grid max-h-60 grid-cols-4 gap-2 overflow-y-auto rounded border border-line bg-shell p-2 md:grid-cols-6">
            {assets.map((asset) => {
              const isSelected = value.includes(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggle(asset.id)}
                  aria-pressed={isSelected}
                  aria-label={`${isSelected ? "Remove" : "Add"} image: ${asset.altText ?? asset.id}`}
                  disabled={!isSelected && atLimit}
                  className={`relative h-16 w-full overflow-hidden rounded border transition-colors disabled:opacity-40 ${
                    isSelected ? "border-accent" : "border-transparent hover:border-edge"
                  }`}
                  title={asset.altText ?? asset.id}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.publicUrl} alt="" className="h-full w-full object-cover" />
                  {isSelected && (
                    <span className="absolute right-1 top-1 rounded bg-accent px-1 text-xs text-paper">
                      {value.indexOf(asset.id) + 1}
                    </span>
                  )}
                </button>
              );
            })}
            {assets.length === 0 && (
              <p className="col-span-full text-xs text-graphite">No media uploaded yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
