// Next.js loads .env.local for the app itself; a plain tsx script has to do
// it by hand. This check needs no database, so it deliberately does not load
// any env either.
import { readFile } from "node:fs/promises";

/**
 * Asserts every foreground/background pair the components produce clears
 * WCAG 2.1 AA contrast, in both colour schemes.
 *
 * Colours are parsed out of the `@theme` block in globals.css rather than
 * duplicated here, so editing a token in one place cannot leave this check
 * asserting against a stale value. The dark scheme is resolved the same way
 * the stylesheet resolves it: each `--color-<name>-dark` replaces its base
 * counterpart, for both the media query and the `.dark` class.
 *
 * Text needs 4.5:1 (1.4.3). Control boundaries and focus indicators need 3:1
 * (1.4.11).
 */

const TOKEN_RE = /--color-([a-z-]+):\s*(#[0-9a-f]{6});/gi;

type Scheme = Record<string, string>;

async function readTheme(): Promise<{ light: Scheme; dark: Scheme }> {
  const css = await readFile("src/app/globals.css", "utf8");
  const theme = css.slice(css.indexOf("@theme"), css.indexOf("\n}"));

  const light: Scheme = {};
  const dark: Scheme = {};
  for (const [, name, value] of theme.matchAll(TOKEN_RE)) {
    // `--color-paper-dark` is the dark-mode replacement for `--color-paper`.
    if (name.endsWith("-dark")) {
      dark[name.slice(0, -"-dark".length)] = value;
    } else {
      light[name] = value;
      dark[name] = dark[name] ?? value;
    }
  }
  return { light, dark };
}

function srgbToLinear(c: number) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Each entry names a real class combination in the codebase. `fg`/`bg` are
// token names; `min` is the threshold that applies to that pair.
const PAIRS: { label: string; fg: string; bg: string; min: number }[] = [
  { label: "body text (text-ink on bg-paper)", fg: "ink", bg: "paper", min: 4.5 },
  { label: "muted text and placeholders (text-graphite)", fg: "graphite", bg: "paper", min: 4.5 },
  { label: "links and active nav (text-accent)", fg: "accent", bg: "paper", min: 4.5 },
  { label: "link hover (text-accent-deep)", fg: "accent-deep", bg: "paper", min: 4.5 },
  { label: "primary button label (text-paper on bg-accent)", fg: "paper", bg: "accent", min: 4.5 },
  { label: "primary button label, hover (on bg-accent-deep)", fg: "paper", bg: "accent-deep", min: 4.5 },
  { label: "secondary button label (text-ink)", fg: "ink", bg: "paper", min: 4.5 },
  { label: "text on a shell panel (text-ink on bg-shell)", fg: "ink", bg: "shell", min: 4.5 },
  { label: "muted text on shell", fg: "graphite", bg: "shell", min: 4.5 },
  // `muted` carries the de-emphasised role at its own value rather than as an
  // alpha modifier on `graphite`, which composited to 2.6:1 on shell (#76).
  { label: "de-emphasised text (text-muted on bg-paper)", fg: "muted", bg: "paper", min: 4.5 },
  { label: "de-emphasised text on shell", fg: "muted", bg: "shell", min: 4.5 },
  { label: "link on shell", fg: "accent", bg: "shell", min: 4.5 },
  { label: "error text (text-accent)", fg: "accent", bg: "paper", min: 4.5 },
  { label: "focus ring on paper", fg: "accent", bg: "paper", min: 3 },
  { label: "focus ring on shell", fg: "accent", bg: "shell", min: 3 },
  // The `edge` token exists only for control boundaries: `line` is for
  // decorative rules and is intentionally below 3:1.
  { label: "input, textarea and select border on paper (border-edge)", fg: "edge", bg: "paper", min: 3 },
  { label: "input, textarea and select border on shell", fg: "edge", bg: "shell", min: 3 },
];

async function main() {
  const { light, dark } = await readTheme();

  const missing = new Set<string>();
  for (const { fg, bg } of PAIRS) {
    for (const token of [fg, bg]) {
      if (!light[token]) missing.add(token);
    }
  }
  if (missing.size) {
    console.error(`theme is missing token(s): ${[...missing].join(", ")}`);
    process.exit(1);
  }

  let failures = 0;
  for (const [schemeName, scheme] of Object.entries({ light, dark })) {
    console.log(`\n=== ${schemeName} ===`);
    for (const { label, fg, bg, min } of PAIRS) {
      const ratio = contrast(scheme[fg], scheme[bg]);
      const ok = ratio >= min;
      if (!ok) failures++;
      console.log(
        `${ok ? "PASS" : "FAIL"}  ${ratio.toFixed(2).padStart(6)}:1  (min ${min})  ${label}`
      );
    }
  }

  console.log(
    failures
      ? `\n${failures} pair(s) below WCAG 2.1 AA: adjust the token, not the component`
      : "\nall contrast pairs pass WCAG 2.1 AA in both schemes"
  );
  if (failures) process.exitCode = 1;
}

main().catch((error) => {
  console.error("contrast check threw:", error);
  process.exit(1);
});
