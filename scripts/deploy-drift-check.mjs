/**
 * Asserts that the live site is running main's HEAD.
 *
 * Issue #122 is why this exists: production served a build five commits
 * behind `main` for three days while every CI run stayed green, because CI
 * only checks that the build compiles, never that the deploy happened.
 * Render's own failure notifications don't cover that either — a deploy that
 * was never triggered is not a failed deploy.
 *
 * `GET /api/health` reports the commit the running build came from
 * (`RENDER_GIT_COMMIT`). This compares that to the local `origin/main` HEAD
 * and fails when they differ, so the next silent miss is loud.
 *
 * A grace window keeps the race between merging and a deploy finishing from
 * showing up as drift: a `main` commit younger than GRACE_MINUTES is not yet
 * expected to be live. This does not paper over #122 — once the window
 * passes, a missed deploy still fails.
 *
 * Usage: node scripts/deploy-drift-check.mjs
 *   PROD_URL        default https://piregi-portfolio.onrender.com
 *   GRACE_MINUTES   default 30
 */
import { execFileSync } from "node:child_process";

const PROD_URL = (process.env.PROD_URL ?? "https://piregi-portfolio.onrender.com").replace(/\/$/, "");
const GRACE_MINUTES = Number(process.env.GRACE_MINUTES ?? 30);

/**
 * Render's free plan spins the service down after 15 minutes idle and the
 * first request pays a ~1 minute cold start. Retry on the same deadline a
 * human would use rather than failing on a service that is merely asleep.
 */
const HEALTH_DEADLINE_MS = 150_000;

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

function fail(message) {
  console.error(`FAIL  ${message}`);
  process.exit(1);
}

async function fetchHealth() {
  const deadline = Date.now() + HEALTH_DEADLINE_MS;
  let lastError = "no attempt made";

  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${PROD_URL}/api/health`, {
        signal: AbortSignal.timeout(20_000),
      });
      if (res.ok) return res.json();
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    console.log(`  ... not ready yet (${lastError}), retrying`);
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }

  fail(`${PROD_URL}/api/health never became healthy within ${HEALTH_DEADLINE_MS / 1000}s (${lastError})`);
}

const headSha = git("rev-parse", "origin/main");
const headTimestamp = Number(git("log", "-1", "--format=%ct", "origin/main"));

const health = await fetchHealth();
const live = health.commit ?? null;

if (!live) {
  fail(
    `production reports no commit, so it predates this check and is stale by definition. ` +
      `Deploy ${headSha.slice(0, 7)} (${PROD_URL}); see #122 for why the trigger may not fire.`,
  );
}

if (live === headSha) {
  console.log(`PASS  production is running main's HEAD ${headSha.slice(0, 7)}`);
  process.exit(0);
}

const ageMinutes = (Date.now() / 1000 - headTimestamp) / 60;
if (ageMinutes < GRACE_MINUTES) {
  console.log(
    `PASS  main ${headSha.slice(0, 7)} is ${ageMinutes.toFixed(1)}m old ` +
      `(< ${GRACE_MINUTES}m grace); production still on ${live.slice(0, 7)}, deploy may be in flight`,
  );
  process.exit(0);
}

fail(
  `production is on ${live.slice(0, 7)}, main is ${headSha.slice(0, 7)} ` +
    `(${ageMinutes.toFixed(0)}m old, past the ${GRACE_MINUTES}m grace). The deploy was missed or failed — see #122.`,
);
