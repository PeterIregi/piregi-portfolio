/**
 * Drives the admin login form the way a browser does, and asserts where a
 * successful sign-in lands.
 *
 * `a11y-check.mjs` already covers the rejection path — that a rejected attempt
 * stays on the page, says something, and discloses nothing. This covers what it
 * cannot: the success path. Until #82 the form that rendered called signIn() on
 * the client, and the Server Action it now calls had never run, so nothing
 * asserted that a valid sign-in actually lands anywhere. It does not, silently:
 * `loginAction` has to let Auth.js's NEXT_REDIRECT through its own catch
 * (design.md §4), and swallowing it renders a working credential into a form
 * that just sits there.
 *
 * Deliberately not in CI, like `a11y-check.mjs` and `flows-check.mjs`: every
 * public page is `force-dynamic` and reads the database, and design.md §8
 * keeps DATABASE_URL off CI and preview builds on purpose.
 *
 * Reads the seeded admin (admin@piregi.dev / changeme123), so run it against a
 * dev database only.
 *
 * Note the budget: login is rate limited to 5 attempts per email+IP per 15
 * minutes (src/lib/auth/rate-limit.ts), and the store is per-process, so this
 * must run against a freshly started server. Three of the cases below are
 * valid sign-ins; adding more will throttle them and the later cases will fail
 * for the wrong reason.
 *
 * Usage: BASE=http://localhost:3111 pnpm login:check
 *        CHROME_PATH=/usr/bin/chromium BASE=... node scripts/login-check.mjs
 */
import { chromium } from "playwright-core";
import { access } from "node:fs/promises";
import { constants } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3111";
const EMAIL = "admin@piregi.dev";
const PASSWORD = "changeme123";

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

async function signIn(page, callbackUrl) {
  const query = callbackUrl === undefined ? "" : `?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  await page.goto(`${BASE}/admin/login${query}`, { waitUntil: "networkidle" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page
    .waitForURL((url) => !url.pathname.startsWith("/admin/login"), { timeout: 30000 })
    .catch(() => {});
  return new URL(page.url());
}

async function main() {
  const executablePath = await findChrome();
  if (!executablePath) {
    console.error("No Chrome/Chromium found. Set CHROME_PATH to a binary.");
    process.exit(1);
  }

  const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });

  section("valid sign-in");
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const url = await signIn(page);

    ok(url.pathname === "/admin", "lands on /admin", `${url.pathname}${url.search}`);
    ok(url.origin === BASE, "stays on this origin", url.origin);
    const cookies = await context.cookies();
    ok(
      cookies.some((c) => c.name.includes("session-token")),
      "sets a session cookie",
      cookies.map((c) => c.name).join(",")
    );
    // redirect() is a soft navigation: the URL changes before the new DOM is in
    // place, so waiting on the URL alone would pass while the form is still up.
    const formGone = await page
      .waitForFunction(() => document.querySelector("#password") === null, null, { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    ok(formGone, "the login form is replaced by the destination page");

    await context.close();
  }

  section("callbackUrl is honoured");
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const url = await signIn(page, "/admin/cv");
    ok(url.pathname === "/admin/cv", "returns to the page that was asked for", url.pathname);
    ok(url.origin === BASE, "stays on this origin", url.origin);
    await context.close();
  }

  section("off-site callbackUrl is refused");
  {
    // One representative case, because each of these costs a rate-limited
    // attempt: `//host` is the one that redirects to another origin, and it is
    // not caught by a naive `/`-prefix check. `https://host` and `/\host` are
    // refused by the same guard in src/actions/auth.ts.
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const url = await signIn(page, "//evil.example/steal");
    ok(url.origin === BASE, "does not leave this origin", url.origin);
    ok(url.pathname === "/admin", "falls back to /admin", `${url.pathname}${url.search}`);
    await context.close();
  }

  await browser.close();

  console.log(failures ? `\n${failures} FAILURE(S)` : "\nall login checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error("login check threw:", error);
  process.exit(1);
});
