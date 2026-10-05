"use client";

import { useEffect, useRef, useState } from "react";
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

export default function AdminMediaPage() {
  const [images, setImages] = useState<ImageRow[]>([]);
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
            <div key={img.id} className="relative group bg-shell rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.publicUrl} alt={img.altText ?? ""} className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-accent/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDelete(img.id)}
                  className="text-white px-4 py-2 rounded hover:bg-accent-deep"
                >
                  Delete
                </button>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-ink truncate">{displayName(img.storagePath)}</p>
                <p className="text-xs text-graphite">
                  {formatBytes(img.sizeBytes)} · {format(new Date(img.uploadedAt), "MMM d, yyyy")}
                </p>
                {img.altText ? (
                  <p className="text-xs text-graphite mt-1 truncate">{img.altText}</p>
                ) : (
                  <p className="text-xs text-accent mt-1">Missing alt text</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
