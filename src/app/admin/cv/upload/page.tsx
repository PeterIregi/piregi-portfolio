"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { MAX_CV_BYTES, validateCvFile } from "@/lib/validation/upload";

const MAX_CV_LABEL = `${MAX_CV_BYTES / (1024 * 1024)}MB`;

export default function UploadCvPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById("cvFile") as HTMLInputElement;
    const file = fileInput.files?.[0] ?? null;

    // Same schema the upload route runs, so the message here matches what
    // the server would say. The server still decides (design.md §4).
    const rejection = validateCvFile(file);
    if (rejection) {
      setFormError(rejection);
      return;
    }

    setLoading(true);
    setFormError("");

    const formData = new FormData();
    formData.append("file", file as File);

    try {
      const res = await fetch("/api/admin/cv/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload failed");
      }

      router.push("/admin/cv?uploaded=1");
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Upload failed");
      setLoading(false);
    }
  };

  return (
    <Container className="py-8 max-w-2xl">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-ink">Upload CV</h1>
        <p className="text-graphite mt-2">Upload a new PDF version of your CV (max {MAX_CV_LABEL})</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        {formError && <div className="p-4 rounded border border-claret bg-claret/10 text-claret text-sm">{formError}</div>}

        <div className="flex flex-col gap-2">
          <label htmlFor="cvFile" className="text-sm font-medium text-ink">PDF File</label>
          <input
            id="cvFile"
            type="file"
            accept="application/pdf"
            required
            className="h-11 w-full rounded border border-edge bg-paper px-3.5 text-ink placeholder:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-claret"
          />
          <p className="text-sm text-graphite">PDF only, max {MAX_CV_LABEL}</p>
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
          {loading ? "Uploading…" : "Upload CV"}
        </Button>
      </form>

      <Link href="/admin/cv" className="text-claret hover:text-claret-deep text-sm inline-block mt-6">← Back to CV management</Link>
    </Container>
  );
}