"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function AdminMediaPage() {
  const [images, setImages] = useState<{ id: string; publicUrl: string; altText: string | null; originalFilename: string; uploadedAt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setImages([data, ...images]);
      alert("Upload successful!");
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (res.ok) {
        setImages(images.filter(img => img.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-ink">Media Library</h1>
        <label className="cursor-pointer">
          <Button variant="primary">
            Upload Image
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </Button>
        </label>
      </div>

      {images.length === 0 ? (
        <p className="text-graphite text-center py-12">No images uploaded yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="relative group bg-shell rounded-lg overflow-hidden">
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