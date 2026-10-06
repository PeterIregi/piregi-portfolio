import type { CSSProperties, ReactNode } from "react";

type MediaFrameProps = {
  /** Recorded intrinsic width, or null on rows uploaded before #90. */
  width: number | null;
  /** Recorded intrinsic height, or null on rows uploaded before #90. */
  height: number | null;
  /**
   * Ratio used when the asset has no recorded size, as a `"w / h"` string so it
   * reads the same way in a call site as the CSS it replaces. Load-bearing
   * rather than cosmetic: without it a pre-#90 image would collapse to zero
   * height, since `next/image` renders `fill` as `position: absolute; inset: 0`.
   */
  fallback: string;
  /**
   * Element to render. The gallery passes `figure` so its plates keep the
   * self-contained-illustration semantics they had before this component
   * existed.
   */
  as?: "div" | "figure";
  className?: string;
  children: ReactNode;
};

/**
 * Reserves layout space for an image that `next/image` renders with `fill`, at
 * the asset's own ratio once `media_assets` records one (design.md §10).
 *
 * The ratio goes in as an inline `aspect-ratio` rather than a Tailwind class
 * because `aspect-[3/2]` has to be a literal at build time to exist in the
 * stylesheet; a ratio computed per asset cannot be one. It is data, not a
 * token, so nothing here bypasses the theme.
 */
export function MediaFrame({
  width,
  height,
  fallback,
  as: Element = "div",
  className,
  children,
}: MediaFrameProps) {
  const aspectRatio: CSSProperties["aspectRatio"] =
    width && height ? `${width} / ${height}` : fallback;

  return (
    <Element
      className={`relative ${className ?? ""}`.trim()}
      style={{ aspectRatio }}
    >
      {children}
    </Element>
  );
}