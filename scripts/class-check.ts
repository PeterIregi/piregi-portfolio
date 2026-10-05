// Asserts that every colour utility the components ask for actually resolves to
// something in the theme, and that it came from the theme rather than from
// Tailwind's stock palette.
//
// Tailwind v4 omits a utility it cannot resolve. A component using
// `bg-claret` after the accent token was renamed compiles to *no CSS at all*,
// with no error from the compiler, `eslint`, `tsc`, or `pnpm build`: the
// element simply renders unstyled. That is the failure mode which let #31 and
// #62 be closed while the build emitted zero stylesheets, and PR #66 fixed the
// cause without adding a guard for the class.
//
// So rather than maintaining a list of expected class names, this asks
// Tailwind itself: it compiles the project's own `globals.css` with
// `source(none)`, hands it every candidate found in the source, and reports
// the ones it declined. The theme therefore has exactly one source of truth
// (design.md §10), and a token renamed or deleted shows up here instead of
// silently producing an unstyled element.
//
// Resolution is not sufficient on its own, so this also rejects Tailwind's
// stock colours. `text-white` resolves perfectly and is still wrong: in dark
// mode the accent inverts to a light red, so white text lands on a light
// background at 3.36:1. `check:contrast` cannot see it either, because that
// check asserts a hand-written list of token pairs, and a component reaching
// around the tokens is by definition not on the list. #72 is that instance;
// #66 fixed fifteen of them for `bg-white`.

import { compile } from "tailwindcss";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const SOURCE_DIR = "src";
const GLOBALS_CSS = "src/app/globals.css";

/**
 * Tailwind's own palette, which is available to any component and therefore
 * needs no token to be wrong. These do not flip with the colour scheme, which
 * is the whole reason a component may not use them.
 */
const STOCK_COLOUR_RE =
  /^(?:[a-z][a-z0-9-]*:)*(?:bg|text|border|ring|fill|stroke|from|via|to|divide|decoration|outline)-(?:white|black)(?:\/[0-9]+)?$/;

/**
 * An opacity modifier on a text colour, e.g. `text-graphite/60`.
 *
 * `check:contrast` vouches for the tokens; an alpha modifier is applied
 * afterwards, in the component, against whatever happens to be behind it. The
 * shipped colour is then neither token the check inspected, so it can pass
 * every guard and still fail WCAG 1.4.3: `text-graphite/60` reached 2.6:1 on
 * `shell`, where `text-graphite` on its own is 6.08:1 (#76). Only text-bearing
 * families are covered. `bg-accent/10` and the other panel tints are fine --
 * those are decorative backgrounds, not text, and nothing depends on them
 * being legible.
 */
const TEXT_ALPHA_RE = /^(?:[a-z][a-z0-9-]*:)*(?:text|placeholder)-[a-z0-9-]+\/[0-9]+$/;

/**
 * The colour-bearing utility families. Each also holds non-colour members
 * (`text-sm`, `border-b`, `outline-2`, `divide-y`), which is safe to offer
 * Tailwind: those resolve, so they cannot be reported. Restricting to these
 * families is what keeps unrelated strings in the source — `user-agent`,
 * `x-forwarded-for`, `mobile-nav` — from being mistaken for class names.
 */
const FAMILY =
  "(?:bg|text|border|outline|ring|fill|stroke|from|via|to|divide|placeholder|accent|caret|decoration|shadow)";
const CLASS_RE = new RegExp(
  `^(?:[a-z][a-z0-9-]*:)*${FAMILY}-[a-z0-9\\[\\]/_.-]+(?:/[0-9]+)?$`
);

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.tsx?$/.test(entry.name)) yield full;
  }
}

/**
 * The text of every string and template literal in a file, paired with the line
 * it starts on. Interpolations are skipped rather than parsed: their contents
 * are expressions, not class names, and the literals around them still carry
 * everything needed to find a class.
 *
 * Comments are skipped, and that is not cosmetic. `button.tsx` documents its
 * own convention as "`text-paper` rather than `text-white`", and a scanner
 * that treats those backticks as a template literal reports the class it is
 * explaining the absence of.
 */
function literals(source: string): { text: string; line: number }[] {
  const found: { text: string; line: number }[] = [];
  let line = 1;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === "\n") {
      line++;
      continue;
    }

    if (char === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      line++;
      continue;
    }

    if (char === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? source.length : end + 2;
      for (; i < stop; i++) if (source[i] === "\n") line++;
      i--;
      continue;
    }

    if (char !== '"' && char !== "'" && char !== "`") continue;

    const quote = char;
    const startLine = line;
    let text = "";
    let j = i + 1;

    while (j < source.length) {
      const inner = source[j];
      if (inner === "\n") line++;
      if (inner === "\\") {
        text += source[j + 1] ?? "";
        j += 2;
        continue;
      }
      if (inner === quote) break;
      if (inner === "$" && source[j + 1] === "{") {
        let depth = 1;
        j += 2;
        while (j < source.length && depth > 0) {
          if (source[j] === "{") depth++;
          else if (source[j] === "}") depth--;
          else if (source[j] === "\n") line++;
          j++;
        }
        text += " ";
        continue;
      }
      text += inner;
      j++;
    }

    if (text.trim()) found.push({ text, line: startLine });
    i = j;
  }

  return found;
}

/** Every colour-utility-shaped token in the source, mapped to where it appears. */
async function candidates(): Promise<Map<string, string[]>> {
  const found = new Map<string, string[]>();

  for await (const file of walk(SOURCE_DIR)) {
    const source = await readFile(file, "utf8");
    for (const { text, line } of literals(source)) {
      for (const raw of text.split(/\s+/)) {
        const token = raw.replace(/^[`'"]+|[`'"]+$/g, "");
        if (!CLASS_RE.test(token)) continue;
        found.set(token, [...(found.get(token) ?? []), `${file}:${line}`]);
      }
    }
  }

  return found;
}

/**
 * Compiles the project stylesheet with source scanning off, so Tailwind builds
 * only the candidates it is handed.
 */
async function buildFor(names: string[]): Promise<string> {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const entry = require.resolve("tailwindcss/index.css");
  const globals = await readFile(GLOBALS_CSS, "utf8");
  const compiled = globals.replace(/@import\s+"tailwindcss"/, '@import "tailwindcss" source(none)');

  if (compiled === globals) {
    throw new Error(
      `could not find the \`@import "tailwindcss"\` line in ${GLOBALS_CSS}; this check compiles that file directly, so it needs to import Tailwind the normal way`
    );
  }

  const compiler = await compile(compiled, {
    base: process.cwd(),
    from: GLOBALS_CSS,
    loadStylesheet: async (id: string) => {
      if (id === "tailwindcss") {
        return { path: entry, base: path.dirname(entry), content: await readFile(entry, "utf8") };
      }
      throw new Error(`unexpected stylesheet "${id}" while compiling ${GLOBALS_CSS}`);
    },
  });

  return compiler.build(names);
}

/**
 * The class names present in the compiled CSS. Selectors are unescaped back to
 * the name as written, stopping at the pseudo-class or attribute selector that
 * follows it, so `focus-visible:outline-accent` matches the candidate
 * `focus-visible:outline-accent` and not merely the bare `outline-accent`.
 */
function emittedClasses(css: string): Set<string> {
  const names = new Set<string>();

  for (const [, selector] of css.matchAll(/\.((?:\\.|[^\s{},>+~()])+)/g)) {
    let name = "";
    for (let i = 0; i < selector.length; i++) {
      if (selector[i] === "\\") {
        name += selector[i + 1];
        i++;
        continue;
      }
      if (selector[i] === ":" || selector[i] === "[" || selector[i] === ".") break;
      name += selector[i];
    }
    if (name) names.add(name);
  }

  return names;
}

async function main() {
  const found = await candidates();
  if (!found.size) {
    console.error(`no colour utilities found under ${SOURCE_DIR}/; the scan is not reading the source`);
    process.exit(1);
  }

  const names = [...found.keys()];
  const emitted = emittedClasses(await buildFor(names));

  let failed = false;

  const stock = names.filter((name) => STOCK_COLOUR_RE.test(name)).sort();
  if (stock.length) {
    failed = true;
    console.error(
      `${stock.length} class(es) use Tailwind's stock palette instead of a theme token, so they do not flip with the colour scheme:\n`
    );
    for (const name of stock) {
      console.error(`  ${name}`);
      for (const where of found.get(name)!.slice(0, 3)) console.error(`      ${where}`);
      console.error(
        `      -> use the token for the role instead (paper, ink, accent, shell): \`text-paper\` is \`text-white\` in light mode and near-black in dark, which is why it is the convention in button.tsx`
      );
    }
  }

  const alphaText = names.filter((name) => TEXT_ALPHA_RE.test(name)).sort();
  if (alphaText.length) {
    failed = true;
    console.error(
      `${alphaText.length} class(es) fade text with an opacity modifier, so the shipped colour is not the token check:contrast vouched for:\n`
    );
    for (const name of alphaText) {
      console.error(`  ${name}`);
      for (const where of found.get(name)!.slice(0, 3)) console.error(`      ${where}`);
      console.error(
        `      -> use the \`muted\` token for de-emphasised text, or \`graphite\`; if the tint is genuinely needed, add a token whose value is checked against its background`
      );
    }
  }

  const unresolved = names.filter((name) => !emitted.has(name)).sort();
  if (unresolved.length) {
    failed = true;
    console.error(
      `${unresolved.length} class(es) resolve to nothing, so Tailwind emits no CSS for them:\n`
    );
    for (const name of unresolved) {
      console.error(`  ${name}`);
      for (const where of found.get(name)!.slice(0, 3)) console.error(`      ${where}`);
      console.error(`      -> use a token from the @theme block in ${GLOBALS_CSS}`);
    }
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  console.log(
    `all ${names.length} colour utilities across ${SOURCE_DIR}/ come from @theme and resolve`
  );
}

main().catch((error) => {
  console.error("class check threw:", error);
  process.exit(1);
});
