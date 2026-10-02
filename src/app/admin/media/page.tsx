"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type ImageRow = {
  id: string;
  publicUrl: string;
  altText: string | null;
  originalFilename: string | null;
  uploadedAt: string;
};

export default function AdminMediaPage() {
  const [images, setImages] = useState<ImageRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/media")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load images"))))
      .then(setImages)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load images"));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data: ImageRow = await res.json();
      setImages([data, ...images]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setImages(images.filter((img) => img.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Media Library</h1>
        <label className="cursor-pointer">
          <Button variant="primary" disabled={uploading}>
            {uploading ? "Uploading…" : "Upload Image"}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          </Button>
        </label>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded border border-claret bg-claret/10 text-claret text-sm">{error}</div>
      )}

      {images.length === 0 ? (
        <p className="text-graphite text-center py-12">No images uploaded yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="relative group bg-shell rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.publicUrl} alt={img.altText ?? ""} className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-claret/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDelete(img.id)} className="text-white px-4 py-2 rounded hover:bg-claret-deep">
                  Delete
                </button>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-ink truncate">{img.originalFilename ?? "Untitled"}</p>
                <p className="text-xs text-graphite">{format(new Date(img.uploadedAt), "MMM d, yyyy")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}