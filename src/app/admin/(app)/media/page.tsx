"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/validation/upload";

type ImageRow = {
  id: string;
  storagePath: string;
  publicUrl: string;
  altText: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  uploadedAt: string;
};

function displayName(storagePath: string) {
  const file = storagePath.split("/").pop() ?? storagePath;
  return file.replace(/^[0-9a-f-]{36}-/, "");
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Intrinsic size, read here rather than from the file's bytes on the server
 * because the browser can already decode every format in `ALLOWED_IMAGE_TYPES`,
 * so this costs no dependency and no new parsing code to own (design.md §10).
 *
 * Returns null when the browser cannot decode the file. That is not a failed
 * upload: the route treats dimensions as optional and the pages that render
 * the image fall back to a hardcoded ratio (#90).
 */
async function readImageSize(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

export default function AdminMediaPage() {
  const [images, setImages] = useState<ImageRow[]>([]);
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [altEdits, setAltEdits] = useState<Record<string, string>>({});
  const [savingAltId, setSavingAltId] = useState<string | null>(null);
  const [altSavedId, setAltSavedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/media")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load images"))))
      .then((rows) => {
        setImages(rows);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load images");
        setLoading(false);
      });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // UX sugar only: the same rules run server-side in the upload route
    // (design.md §4), so this is here to fail fast, not to enforce.
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`Image must be ${formatBytes(MAX_IMAGE_BYTES)} or smaller`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("altText", altText);
    const size = await readImageSize(file);
    if (size) {
      formData.append("width", String(size.width));
      formData.append("height", String(size.height));
    }

    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Upload failed");
      setImages((current) => [body, ...current]);
      setAltText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setImages((current) => current.filter((img) => img.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleSaveAlt = async (id: string) => {
    setError("");
    setAltSavedId(null);

    const value = altEdits[id] ?? "";
    setSavingAltId(id);
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText: value }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Failed to save alt text");

      setImages((current) =>
        current.map((img) => (img.id === id ? { ...img, altText: body.altText } : img))
      );
      setAltEdits((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setAltSavedId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save alt text");
    } finally {
      setSavingAltId(null);
    }
  };

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Media Library</h1>
        <Button variant="primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload Image"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif,.avif"
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </div>

      <div className="mb-8 max-w-md">
        <label htmlFor="altText" className="block text-sm font-medium text-ink mb-1.5">
          Alt text for the next upload
        </label>
        <input
          id="altText"
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Describe the image for screen readers"
          className="h-11 w-full rounded border border-edge bg-paper px-3.5 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <p className="text-xs text-graphite mt-1.5">
          Stored with the asset and reused wherever the image is rendered. Accepted:{" "}
          {ALLOWED_IMAGE_TYPES.join(", ")}, up to {formatBytes(MAX_IMAGE_BYTES)}.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded border border-accent bg-accent/10 text-accent text-sm"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-graphite text-center py-12">Loading images…</p>
      ) : images.length === 0 ? (
        <p className="text-graphite text-center py-12">No images uploaded yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="bg-shell rounded-lg overflow-hidden flex flex-col">
              <div className="relative group h-48">
                <Image
                  src={img.publicUrl}
                  alt={img.altText ?? ""}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-accent/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="text-paper px-4 py-2 rounded hover:bg-accent-deep"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <p className="text-sm font-medium text-ink truncate">{displayName(img.storagePath)}</p>
                <p className="text-xs text-graphite">
                  {formatBytes(img.sizeBytes)} · {format(new Date(img.uploadedAt), "MMM d, yyyy")}
                </p>
                <div className="mt-auto">
                  <label htmlFor={`alt-${img.id}`} className="text-xs font-medium text-ink block mb-1.5">
                    Alt text
                  </label>
                  <div className="flex gap-2">
                    <input
                      id={`alt-${img.id}`}
                      type="text"
                      value={altEdits[img.id] ?? img.altText ?? ""}
                      onChange={(e) =>
                        setAltEdits((current) => ({ ...current, [img.id]: e.target.value }))
                      }
                      className="h-9 w-full min-w-0 rounded border border-edge bg-paper px-3 text-ink placeholder:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      placeholder="Describe the image for screen readers"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveAlt(img.id)}
                      disabled={savingAltId === img.id}
                      className="h-9 px-3 rounded border border-edge bg-paper text-sm font-medium text-ink hover:bg-shell focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
                    >
                      {savingAltId === img.id ? "Saving…" : "Save"}
                    </button>
                  </div>
                  {img.altText === null && !(altEdits[img.id] ?? "").trim() && (
                    <p className="text-xs text-accent mt-1.5">Missing alt text</p>
                  )}
                  {altSavedId === img.id && (
                    <p className="text-xs text-graphite mt-1.5">Alt text saved</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
