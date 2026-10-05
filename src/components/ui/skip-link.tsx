/**
 * First tab stop on every page. The nav sits above a full-width hero, so
 * without this a keyboard user tabs through the whole nav on every page
 * (WCAG 2.4.1 Bypass Blocks). It is off-screen until focused rather than
 * display:none, because a hidden element cannot receive focus.
 */
export function SkipLink({ target = "#main", label = "Skip to main content" }: { target?: string; label?: string }) {
  return (
    <a
      href={target}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-paper focus:outline-2 focus:outline-offset-2 focus:outline-claret"
    >
      {label}
    </a>
  );
}
