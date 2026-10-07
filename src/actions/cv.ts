"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { activateCv, deleteCv, getCvById, isCvIdDeletable } from "@/lib/db/cv";
import { deleteObject } from "@/lib/storage";

const CV_PAGE = "/admin/cv";

/**
 * Server Actions replacing the `<form action="/api/admin/cv/...">` buttons
 * on /admin/cv. The old forms navigated the browser to the JSON payload,
 * which is the admin-surface leak design.md §9 warns about: the "buttons
 * dump raw JSON in the browser" in #100.
 *
 * On success they redirect back to /admin/cv with a status flag the page
 * renders as a banner; on failure they redirect with the specific message
 * so the admin hears what actually failed (design.md §9).
 */

export async function activateCvAction(id: string) {
  await requireAdmin();

  let message: string | null = null;
  try {
    const existing = await getCvById(id);
    if (!existing) {
      message = "CV not found";
    } else {
      await activateCv(id);
    }
  } catch (error) {
    console.error("activate CV error:", error);
    message = "Failed to activate CV";
  }

  redirect(
    message
      ? `${CV_PAGE}?error=${encodeURIComponent(message)}`
      : `${CV_PAGE}?activated=1`
  );
}

export async function deleteCvAction(id: string) {
  await requireAdmin();

  let message: string | null = null;
  try {
    const existing = await getCvById(id);
    if (!existing) {
      message = "CV not found";
    } else if (!(await isCvIdDeletable(id))) {
      message = "Cannot delete the active CV";
    } else {
      // Object first: a surviving row pointing at a deleted object looks
      // intact but 500s on download (mirrors the route's ordering).
      await deleteObject(existing.storagePath, "cv-files");
      await deleteCv(id);
    }
  } catch (error) {
    console.error("delete CV error:", error);
    message = "Failed to delete CV";
  }

  redirect(
    message
      ? `${CV_PAGE}?error=${encodeURIComponent(message)}`
      : `${CV_PAGE}?deleted=1`
  );
}