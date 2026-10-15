export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      // Render sets this to the commit the running build came from. The
      // deploy-drift check compares it against main's HEAD, which is how a
      // silently missed deploy (#122) gets caught instead of serving a
      // stale build. Null locally and in CI, where nothing is deployed.
      commit: process.env.RENDER_GIT_COMMIT ?? null,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
