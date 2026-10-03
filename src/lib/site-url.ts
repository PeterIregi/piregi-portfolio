/**
 * Canonical site origin for absolute URLs (sitemap, robots, JSON-LD,
 * Open Graph).
 *
 * This is deployment config rather than CMS content, so it comes from the
 * environment instead of site_settings: deriving it from the ogImage (the
 * previous approach) resolves to the image CDN's origin whenever the asset
 * lives in Supabase Storage, which would emit supabase.co as the canonical
 * site. See .env.example.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      // Trailing slash stripped so callers can safely append "/projects".
      return new URL(configured).origin;
    } catch {
      console.warn("NEXT_PUBLIC_SITE_URL is not a valid URL; using piregi.dev");
    }
  }
  return "https://piregi.dev";
}