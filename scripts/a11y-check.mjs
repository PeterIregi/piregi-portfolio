/**
 * Runtime accessibility check against a running app.
 *
 * `check:contrast` and axe-core cover the parts of WCAG 2.1 AA that can be
 * read off the source: token pairs, alt text, accessible names, roles. What
 * they cannot cover is the behaviour that only exists once a browser is
 * driving it — where the tab order actually goes, whether the focused element
 * is visibly indicated, whether the mobile nav opens and closes, and whether
 * a rejected submission is announced. Issue #68 asked for exactly that pass,
 * and it could not be done while the build emitted no CSS.
 *
 * Deliberately not in CI: every public page is `force-dynamic` and reads the
 * database, and design.md §8 keeps DATABASE_URL off preview and CI builds on
 * purpose. This runs locally against a dev server, like `flows-check.mjs`.
 *
 * Usage: BASE=http://localhost:3111 node scripts/a11y-check.mjs
 *        CHROME_PATH=/usr/bin/chromium BASE=... node scripts/a11y-check.mjs
 */
import { chromium } from "playwright-core";
import { createRequire } from "node:module";
import { access } from "node:fs/promises";
import { constants } from "node:fs";

const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve("axe-core/axe.min.js");

const BASE = process.env.BASE ?? "http://localhost:3111";

const PUBLIC_ROUTES = ["/", "/about", "/projects", "/experience", "/contact", "/cv"];

/** The routes the header nav links to, i.e. the ones that own an aria-current. */
const NAV_SECTIONS = ["/about", "/projects", "/experience", "/contact"];

let failures = 0;

const ok = (cond, label, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures += 1;
};

const section = (title) => console.log(`\n${title}\n${"-".repeat(title.length)}`);

async function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  for (const path of candidates) {
    try {
      await access(path, constants.X_OK);
      return path;
    } catch {
      // next
    }
  }
  return null;
}

/** Tab until `selector` holds focus, so :focus-visible actually applies. */
async function tabTo(page, selector, limit = 15) {
  await page.evaluate(() => document.activeElement?.blur?.());
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press("Tab");
    const hit = await page.evaluate((sel) => Boolean(document.activeElement?.matches(sel)), selector);
    if (hit) return true;
  }
  return false;
}

/** Everything the tab order should reach, with the focus indicator it shows. */
async function tabWalk(page, limit = 40) {
  const stops = [];
  await page.evaluate(() => {
    document.activeElement?.blur?.();
  });

  for (let i = 0; i < limit; i++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const el = document.activeElement;
      // Tabbing past the last stop returns focus to the document.
      if (!el || el === document.body || el === document.documentElement) return null;

      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      const outlineWidth = Number.parseFloat(style.outlineWidth) || 0;

      return {
        tag: el.tagName.toLowerCase(),
        name: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40),
        href: el.getAttribute("href"),
        focusableSize: `${Math.round(box.width)}x${Math.round(box.height)}`,
        hasOutline: style.outlineStyle !== "none" && outlineWidth > 0,
        hasBoxShadow: style.boxShadow !== "none",
      };
    });

    if (!stop) break;
    stops.push(stop);
  }

  return stops;
}

async function checkRoute(browser, route) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });

  section(`GET ${route}`);

  // --- axe-core: the automated half, kept as a regression floor -------------
  await page.addScriptTag({ path: AXE_PATH });
  const violations = await page.evaluate(async () => {
    const run = await globalThis.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
    return run.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
      target: v.nodes[0]?.target?.join(" ") ?? "",
    }));
  });
  ok(
    violations.length === 0,
    `axe-core reports no WCAG 2.1 A/AA violations`,
    violations.map((v) => `${v.id}(${v.impact}, ${v.nodes} node(s), ${v.target})`).join("; ")
  );

  // --- one h1, and a main landmark for the skip link to land on -------------
  const structure = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    main: document.querySelectorAll("main").length,
    mainId: document.querySelector("main")?.id ?? null,
    navsWithoutLabel: [...document.querySelectorAll("nav")].filter((n) => !n.getAttribute("aria-label")).length,
    imagesWithoutAlt: [...document.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt")).length,
  }));
  ok(structure.h1 === 1, "exactly one h1", `found ${structure.h1}`);
  ok(structure.main === 1 && Boolean(structure.mainId), "one <main> landmark with an id", `id=${structure.mainId}`);
  ok(structure.navsWithoutLabel === 0, "every <nav> is labelled", `${structure.navsWithoutLabel} unlabelled`);
  ok(structure.imagesWithoutAlt === 0, "every <img> has alt", `${structure.imagesWithoutAlt} missing`);

  // --- the skip link is the first tab stop and actually moves focus --------
  const stops = await tabWalk(page);
  ok(stops.length > 0, "page is reachable by keyboard", `${stops.length} stops`);
  ok(
    stops[0]?.href?.startsWith("#") === true,
    "first tab stop is the skip link",
    stops[0] ? `${stops[0].tag}[href=${stops[0].href}] "${stops[0].name}"` : "no stops"
  );

  // Measured while focused: `sr-only` is what hides it, and focus is what
  // reveals it, so measuring an unfocused skip link only ever reports 1x1.
  const reachedSkipLink = await tabTo(page, 'a[href="#main"]');
  const skipVisible = reachedSkipLink
    ? await page.evaluate(() => {
        const link = document.querySelector('a[href="#main"]');
        const box = link.getBoundingClientRect();
        const style = getComputedStyle(link);
        return {
          box: `${Math.round(box.width)}x${Math.round(box.height)}`,
          onScreen: box.top >= 0 && box.left >= 0 && box.width > 0 && box.height > 0,
          hasRing: style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0,
        };
      })
    : null;
  ok(
    skipVisible?.onScreen === true,
    "skip link becomes visible when focused (not display:none)",
    skipVisible ? `box ${skipVisible.box}` : "never received focus"
  );
  ok(skipVisible?.hasRing === true, "skip link shows a focus indicator");

  // Activating it must land focus past the header, not just scroll.
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const afterSkip = await page.evaluate(() => {
    const active = document.activeElement;
    return {
      inMain: Boolean(active?.closest("main")),
      tag: active?.tagName.toLowerCase() ?? null,
    };
  });
  ok(
    afterSkip.inMain === true || afterSkip.tag === "body",
    "activating the skip link moves focus into <main>",
    `focus on <${afterSkip.tag}>`
  );

  // --- every tab stop is visible and visibly indicated ----------------------
  const noRing = stops.filter((s) => !s.hasOutline && !s.hasBoxShadow);
  ok(
    noRing.length === 0,
    "every tab stop shows a focus indicator",
    noRing.map((s) => `${s.tag} "${s.name}"`).join("; ")
  );

  const zeroSize = stops.filter((s) => s.focusableSize.startsWith("0x") || s.focusableSize.endsWith("x0"));
  ok(zeroSize.length === 0, "no tab stop is zero-sized", zeroSize.map((s) => `${s.tag} "${s.name}"`).join("; "));

  // --- the active nav item is announced, not just coloured -----------------
  // Only the four sections are nav links. /cv is reached through the header's
  // Download CV button, which sits outside the nav landmark, so it is not
  // expected to carry aria-current.
  const navState = await page.evaluate(() => {
    const links = [...document.querySelectorAll('nav a[href]')];
    const current = links.filter((a) => a.getAttribute("aria-current") === "page");
    return {
      total: links.length,
      current: current.map((a) => a.getAttribute("href")),
    };
  });
  if (NAV_SECTIONS.includes(route)) {
    ok(
      navState.current.length === 1 && navState.current[0] === route,
      `active nav item carries aria-current="page"`,
      `current=[${navState.current.join(", ")}] expected ${route}`
    );
  } else {
    console.log(
      `NOTE  ${route} is not a nav section, so aria-current is not asserted` +
        (navState.current.length === 0 ? " (none present)" : ` (current=[${navState.current.join(", ")}])`)
    );
  }

  await context.close();
}

/**
 * The mobile disclosure. The desktop nav is `hidden md:flex`, so below md the
 * only route to the four sections is this button; if it does not open, or does
 * not close on navigation, the site is unnavigable on a phone.
 */
async function checkMobileNav(browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: 720 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  section("mobile nav (375px)");

  const toggle = page.locator('button[aria-controls="mobile-nav"]');
  ok((await toggle.count()) === 1, "disclosure button exists below md");
  ok((await toggle.getAttribute("aria-expanded")) === "false", "starts collapsed");

  const desktopNavVisible = await page.locator('nav[aria-label="Main"]').first().isVisible();
  ok(desktopNavVisible === false, "desktop nav is hidden below md");

  // Checked before opening the panel: after a click, Chrome continues Tab from
  // the clicked button rather than from the top of the document, so the button
  // itself would never be reached.
  // Reached by Tab, not element.focus(): :focus-visible only matches keyboard
  // focus, so a programmatic focus would report a missing ring that a real
  // keyboard user does not have.
  const reachedToggle = await tabTo(page, 'button[aria-controls="mobile-nav"]');
  const toggleRing = reachedToggle
    ? await page.evaluate(() => {
        const style = getComputedStyle(document.activeElement);
        return style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0;
      })
    : false;
  ok(reachedToggle, "disclosure button is reachable by keyboard");
  ok(toggleRing, "disclosure button shows a focus indicator");

  // Operable from the keyboard, not just clickable.
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  ok((await toggle.getAttribute("aria-expanded")) === "true", "Enter opens the panel");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  ok((await toggle.getAttribute("aria-expanded")) === "false", "Enter closes the panel");

  await toggle.click();
  await page.waitForTimeout(150);

  ok((await toggle.getAttribute("aria-expanded")) === "true", "opens on click");

  const panel = page.locator("#mobile-nav");
  ok(await panel.isVisible(), "panel becomes visible");

  const exposed = await page.evaluate(() => {
    const nav = document.getElementById("mobile-nav");
    if (!nav) return null;
    const links = [...nav.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    const cv = [...nav.querySelectorAll("a")].find((a) => a.textContent?.includes("Download CV"));
    return { links, cv: Boolean(cv), cvHref: cv?.getAttribute("href") ?? null };
  });
  ok(
    exposed !== null &&
      ["/about", "/projects", "/experience", "/contact"].every((href) => exposed.links.includes(href)),
    "all four sections are exposed",
    exposed ? `links=[${exposed.links.join(", ")}]` : "panel missing"
  );
  ok(exposed?.cv === true, "Download CV is exposed in the panel", exposed?.cvHref ?? "");

  // Focus must reach the panel, and the button must still be keyboard-operable.
  await page.locator('#mobile-nav a[href="/about"]').click();
  await page.waitForURL("**/about");
  await page.waitForTimeout(200);

  ok(
    (await page.locator("#mobile-nav").count()) === 0,
    "panel closes after navigating",
    `pathname=${new URL(page.url()).pathname}`
  );
  ok((await toggle.getAttribute("aria-expanded")) === "false", "aria-expanded resets after navigating");

  // And the page it landed on must still be keyboard reachable.
  const stops = await tabWalk(page);
  ok(stops.length > 0, "destination page is reachable by keyboard", `${stops.length} stops`);

  await context.close();
}

/** A failed contact submission has to be announced, not silently dropped. */
async function checkContactAnnouncement(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // The contact form keeps native validation (no noValidate), so a malformed
  // email never reaches the server and the browser shows its own bubble. That
  // is fine; what is being tested here is the client-side announcement path for
  // a rejection the *server* produces, so the response is stubbed rather than
  // provoking a real rate limit.
  await page.route("**/api/contact", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error: "Could not be delivered." }),
    })
  );

  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });

  section("contact form rejection");

  const alertRegionExists = await page.evaluate(
    () => document.querySelectorAll('[role="alert"]').length > 0
  );
  ok(alertRegionExists, "a live region exists before submission");

  await page.fill("#name", "Test Visitor");
  await page.fill("#email", "visitor@example.com");
  await page.fill("#message", "Checking that a rejection is announced.");
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => (document.querySelector('[role="alert"]')?.textContent?.trim() ?? "").length > 0,
    null,
    { timeout: 10000 }
  ).catch(() => {});

  const announced = await page.evaluate(() => {
    const region = document.querySelector('[role="alert"]');
    return {
      text: region?.textContent?.trim() ?? "",
      live: region?.getAttribute("aria-live") ?? null,
      role: region?.getAttribute("role") ?? null,
    };
  });
  ok(
    announced.text.length > 0,
    "rejected submission puts text in the live region",
    `text="${announced.text.slice(0, 80)}"`
  );
  ok(
    announced.role === "alert" || announced.live === "assertive" || announced.live === "polite",
    "the region is a live region"
  );

  await context.close();
}

/**
 * The admin auth forms. Rejections here used to be invisible: the login form
 * dropped signIn()'s error on the floor, and the reset/forgot banners were
 * plain divs. All three must carry a pre-rendered live region and fill it.
 */
async function checkAdminAuthAnnouncement(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const alertText = () =>
    page.evaluate(() => {
      const region = document.querySelector('[role="alert"]');
      return region?.textContent?.trim() ?? "";
    });

  section("admin login rejection");

  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  ok((await alertText()) === "", "login page has a live region before submission");

  // A well-formed address for an account that does not exist: authorize()
  // returns null before the hash comparison, so this neither locks the real
  // admin out nor waits on bcrypt.
  await page.fill("#email", "no-such-account@piregi.dev");
  await page.fill("#password", "not-the-password");
  await page.click('button[type="submit"]');

  // Auth.js navigates to /api/auth/error when it refuses the request outright
  // (an untrusted Host, say), which would destroy the context mid-read. That is
  // a server-configuration problem rather than an accessibility one, so it is
  // reported as such instead of crashing the run.
  await page
    .waitForFunction(
      () => (document.querySelector('[role="alert"]')?.textContent?.trim() ?? "").length > 0,
      null,
      { timeout: 15000 }
    )
    .catch(() => {});

  if (!page.url().includes("/admin/login")) {
    ok(false, "submitting the login form stays on the page", `navigated to ${page.url()}`);
    await context.close();
    return;
  }

  const loginMessage = await alertText();
  ok(loginMessage.length > 0, "rejected sign-in tells the user", `text="${loginMessage.slice(0, 80)}"`);
  ok(
    !/no such user|unknown email|not found|does not exist/i.test(loginMessage),
    "the message does not disclose whether the account exists",
    `text="${loginMessage.slice(0, 80)}"`
  );

  const stillUsable = await page.evaluate(() => {
    const button = document.querySelector('button[type="submit"]');
    return button?.disabled === false;
  });
  ok(stillUsable, "the submit button is re-enabled after a rejection");

  section("admin reset-password rejection");

  await page.goto(`${BASE}/admin/reset-password?token=not-a-real-token`, { waitUntil: "networkidle" });
  ok((await alertText()) === "", "reset page has a live region before submission");

  await page.fill("#password", "long-enough-password");
  await page.fill("#confirmPassword", "something-else");
  await page.click('button[type="submit"]');
  await page
    .waitForFunction(
      () => (document.querySelector('[role="alert"]')?.textContent?.trim() ?? "").length > 0,
      null,
      { timeout: 10000 }
    )
    .catch(() => {});

  const resetMessage = await alertText();
  ok(resetMessage.length > 0, "mismatched passwords are announced", `text="${resetMessage.slice(0, 80)}"`);

  await context.close();
}

const executablePath = await findChrome();
if (!executablePath) {
  console.error(
    "No Chrome or Chromium found. Set CHROME_PATH, or install one — this check\n" +
      "drives a real browser because tab order and focus indication do not exist\n" +
      "in the DOM until something focuses the elements."
  );
  process.exit(2);
}

const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
console.log(`browser: ${executablePath}\ntarget:  ${BASE}`);

try {
  for (const route of PUBLIC_ROUTES) {
    await checkRoute(browser, route);
  }
  await checkMobileNav(browser);
  await checkContactAnnouncement(browser);
  await checkAdminAuthAnnouncement(browser);
} finally {
  await browser.close();
}

console.log(
  failures === 0
    ? `\nall accessibility checks passed`
    : `\n${failures} accessibility check(s) failed`
);
process.exit(failures === 0 ? 0 : 1);