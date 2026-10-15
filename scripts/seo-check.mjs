/**
 * Asserts the rendered public head follows site_settings.
 *
 * #129 was a silent break: #18 (SEO metadata) and #24 (settings editor) both
 * closed, but the public head hardcoded its title and description in the root
 * layout and no page emitted Open Graph at all, so editing `site_settings.meta`
 * changed nothing. Nothing checked that the two ends were connected, so both
 * issues looked done. `deploy:check` covers "did the build deploy"; this covers
 * "does the deployed head reflect the CMS".
 *
 * Two tiers, so it is useful in more than one place:
 *
 *   1. Structural checks need no database, only a running app, so they also run
 *      against production. They catch the concrete #129 shape: a missing
 *      Open Graph block, a title the brand template never touched, a brand that
 *      differs between pages.
 *   2. When DATABASE_URL is set, the rendered values are compared to the
 *      `meta`/`brand` rows and to a published project. This is what proves the
 *      head *follows site_settings* rather than merely looking plausible — a
 *      hardcoded title passes tier 1 and fails here.
 *
 * Deliberately not a required check on pull requests, like `a11y-check.mjs`:
 * every public page is `force-dynamic` and reads the database, and design.md §8
 * keeps DATABASE_URL off CI and preview builds. The structural tier needs no
 * database, so it runs on a timer against production from the same
 * `deploy-check.yml` workflow as the drift check, and can be pointed anywhere.
 * The database cross-check is local-only.
 *
 * Usage: BASE=http://localhost:3111 pnpm seo:check
 *        BASE=https://piregi-portfolio.onrender.com pnpm seo:check   # structural only
 *        BASE=... DATABASE_URL=... pnpm seo:check   # adds the cross-check
 */
// Nothing beyond node built-ins is imported at module scope, so the structural
// tier can run in CI with no dependencies installed (the scheduled
// deploy-check workflow runs it against production). `dotenv` and `postgres`
// are pulled in only when the database cross-check actually runs.
//
// BASE is explicit on the command line so it is never ambiguous which site is
// being checked.
const explicitDatabaseUrl = process.env.DATABASE_URL;

const BASE = (process.env.BASE ?? "http://localhost:3111").replace(/\/+$/, "");
const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(BASE);

// Resolved in main(). For a local target it falls back to `.env.local`'s
// DATABASE_URL; a remote target needs one passed explicitly, because
// `.env.local` is the dev database and comparing it to production would pass
// for the wrong reason (they share a project today, #117) or fail confusingly.
let crossCheckDatabaseUrl;

async function resolveCrossCheckUrl() {
  if (explicitDatabaseUrl) return explicitDatabaseUrl;
  if (!local) return undefined;
  const { config } = await import("dotenv");
  config({ path: ".env.local" });
  return process.env.DATABASE_URL;
}

const ROUTES = ["/", "/about", "/projects", "/experience", "/cv", "/contact"];
const INNER_ROUTES = ["/about", "/projects", "/experience", "/cv", "/contact"];

let failures = 0;

const ok = (cond, label, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures += 1;
};

const section = (title) => console.log(`\n${title}\n${"-".repeat(title.length)}`);

/** Attribute value from a single tag, entity-decoded. */
function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i"));
  return match ? decodeEntities(match[1]) : undefined;
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** The head fields this check cares about, read out of the served HTML. */
function head(html) {
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();

  const meta = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    // `<meta name=...>` for description/twitter and `<meta property=...>` for
    // Open Graph; a page can emit both spellings, so they share a namespace.
    const key = (attr(tag, "name") ?? attr(tag, "property") ?? "").toLowerCase();
    const content = attr(tag, "content");
    if (key && content !== undefined) meta[key] = content;
  }

  let canonical;
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    if ((attr(tag, "rel") ?? "").toLowerCase() === "canonical") canonical = attr(tag, "href");
  }

  return {
    title,
    description: meta.description,
    canonical,
    og: {
      title: meta["og:title"],
      description: meta["og:description"],
      url: meta["og:url"],
      siteName: meta["og:site_name"],
      image: meta["og:image"],
    },
    twitter: { card: meta["twitter:card"] },
  };
}

const RETRIES = 4;
const RETRY_DELAY_MS = 1500;

/**
 * Run `fn`, retrying a transient failure a few times.
 *
 * Every public page is `force-dynamic` and reads the database, and the
 * DNS64/NAT64 route to the Supabase pooler drops connections in bursts
 * (`ETIMEDOUT`/`AggregateError`) on this network. That surfaces both as a 500
 * from the server and as a failed direct connection from this script, so both
 * paths retry here rather than reporting a network blip as a real failure. An
 * error marked `fatal` (a 4xx, i.e. the app answering) is not retried.
 */
async function attempt(label, fn) {
  let last;
  for (let i = 1; i <= RETRIES; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error?.fatal) throw error;
      last = error;
      if (i < RETRIES) {
        const reason = error.message?.trim() || error.code || error.name || "connection failed";
        console.log(`      ${label} -> ${reason} (retry ${i}/${RETRIES - 1})`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
  throw last;
}

async function get(path) {
  return attempt(path, async () => {
    const response = await fetch(`${BASE}${path}`);
    if (response.ok) return response.text();
    const error = new Error(`GET ${path} returned ${response.status}`);
    if (response.status < 500) error.fatal = true; // the app answered; do not retry
    throw error;
  });
}

/**
 * A database read on a fresh connection, retried. postgres.js caches a failed
 * connect on the client, so a retry has to start from a new client rather than
 * reusing one that never connected.
 */
async function read(label, fn) {
  return attempt(label, async () => {
    const { default: postgres } = await import("postgres");
    const sql = postgres(crossCheckDatabaseUrl, { max: 1, connect_timeout: 10 });
    try {
      return await fn(sql);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
}

/** The pathname of a URL, so a relative ogImage and a resolved one compare equal. */
function pathname(url) {
  try {
    return new URL(url, "http://relative.invalid").pathname;
  } catch {
    return url;
  }
}

/**
 * A published project route, discovered from the sitemap so tier 1 stays
 * database-free and works against production. The sitemap's `<loc>` uses the
 * canonical origin, which is not necessarily BASE, so only the path is used.
 */
async function projectRoute() {
  const xml = await get("/sitemap.xml");
  const match = xml.match(/<loc>[^<]*\/projects\/([^/<]+)<\/loc>/);
  return match ? `/projects/${match[1]}` : null;
}

async function main() {
  console.log(`seo-check against ${BASE}`);

  const pages = {};
  section("Every public route emits a complete head");
  for (const route of ROUTES) {
    const html = await get(route);
    const parsed = head(html);
    pages[route] = parsed;

    ok(parsed.title.length > 0, `${route} <title> is non-empty`, parsed.title);
    ok(Boolean(parsed.description), `${route} <meta name="description">`, parsed.description);
    ok(
      Boolean(parsed.og.title && parsed.og.description && parsed.og.url && parsed.og.siteName),
      `${route} og:title/description/url/site_name`,
      parsed.og.title
    );
    ok(Boolean(parsed.twitter.card), `${route} twitter:card`, parsed.twitter.card);
    ok(Boolean(parsed.canonical), `${route} canonical link`, parsed.canonical);
  }

  section("One brand, applied by the title template");
  const brand = pages["/"].og.siteName;
  ok(Boolean(brand), "home declares og:site_name", brand);
  for (const route of ROUTES) {
    ok(pages[route].og.siteName === brand, `${route} uses the same og:site_name`, pages[route].og.siteName);
  }
  for (const route of INNER_ROUTES) {
    const title = pages[route].title;
    ok(title.endsWith(` | ${brand}`), `${route} title is templated with the brand`, title);
    ok(brand && title.split(brand).length - 1 === 1, `${route} names the brand exactly once`, title);
  }

  ok(
    pages["/"].title === pages["/about"].og.title,
    "home <title> is the site title the inner pages advertise in og:title",
    `${pages["/"].title} vs ${pages["/about"].og.title}`
  );

  let projectHead = null;
  let projectSlug = null;
  section("Project detail keeps its own Open Graph and the brand template");
  const route = await projectRoute();
  if (!route) {
    console.log("SKIP  no published project in the sitemap");
  } else {
    projectSlug = route.slice("/projects/".length);
    projectHead = head(await get(route));
    ok(projectHead.title.endsWith(` | ${brand}`), `${route} title is templated`, projectHead.title);
    ok(
      projectHead.title === `${projectHead.og.title} | ${brand}`,
      `${route} og:title is the project and the <title> adds the brand`,
      `${projectHead.og.title} -> ${projectHead.title}`
    );
    ok(Boolean(projectHead.og.description), `${route} og:description`, projectHead.og.description);
    ok(projectHead.og.siteName === brand, `${route} og:site_name carries the site brand`, projectHead.og.siteName);
    ok(Boolean(projectHead.canonical), `${route} canonical link`, projectHead.canonical);
    ok(Boolean(projectHead.twitter.card), `${route} twitter:card is inherited from the layout`, projectHead.twitter.card);
  }

  crossCheckDatabaseUrl = await resolveCrossCheckUrl();
  section("Head follows site_settings");
  if (!crossCheckDatabaseUrl) {
    console.log(
      local
        ? "SKIP  set DATABASE_URL (or add it to .env.local) to compare the rendered head against the rows"
        : "SKIP  BASE is remote; pass DATABASE_URL explicitly to cross-check the site against its own database"
    );
  } else {
    const rows = await read("site_settings", (sql) => sql`select key, value from site_settings`);
    const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    const meta = settings.meta ?? {};
    const brandRow = settings.brand ?? {};

    ok(brand === brandRow.name, "og:site_name is brand.name", `${brand} vs ${brandRow.name}`);
    ok(pages["/"].title === meta.title, "home <title> is meta.title", `${pages["/"].title} vs ${meta.title}`);
    ok(
      pages["/"].description === meta.description,
      "home description is meta.description",
      `${pages["/"].description} vs ${meta.description}`
    );
    ok(pages["/about"].og.title === meta.title, "/about og:title is meta.title", pages["/about"].og.title);
    ok(
      pages["/about"].og.description === meta.description,
      "/about og:description is meta.description",
      pages["/about"].og.description
    );

    if (meta.ogImage) {
      ok(
        pathname(pages["/"].og.image ?? "") === pathname(meta.ogImage),
        "home og:image is meta.ogImage",
        `${pages["/"].og.image} vs ${meta.ogImage}`
      );
    }

    if (projectHead && projectSlug) {
      const [project] = await read("projects", (sql) => sql`
        select title, summary, cover_media_id
        from projects
        where slug = ${projectSlug} and status = 'published'
        limit 1
      `);
      if (project) {
        ok(projectHead.og.title === project.title, "project og:title is the project's title", projectHead.og.title);
        ok(
          projectHead.og.description === project.summary,
          "project og:description is the project's summary",
          projectHead.og.description
        );
        if (project.cover_media_id) {
          const [cover] = await read("media_assets", (sql) => sql`
            select public_url from media_assets where id = ${project.cover_media_id} limit 1
          `);
          if (cover) {
            ok(
              pathname(projectHead.og.image ?? "") === pathname(cover.public_url),
              "project og:image is the cover's public URL",
              `${projectHead.og.image} vs ${cover.public_url}`
            );
          }
        }
      }
    }
  }

  console.log(
    failures ? `\n${failures} check(s) failed` : "\nthe public head follows site_settings"
  );
  process.exitCode = failures ? 1 : 0;
}

main().catch((error) => {
  console.error("seo-check threw:", error);
  process.exit(1);
});
