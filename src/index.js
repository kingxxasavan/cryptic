// Cryptic Hub Worker.
//
// Everything in public/ is served as a static asset. The one dynamic route is
// /env.js, which is generated from the Worker's environment variables so the
// Firebase keys live in Cloudflare rather than in the source tree.
//
// public/env.js exists as a blank local-dev fallback; run_worker_first in
// wrangler.jsonc makes this handler win for that path in production.

function envScript(env) {
  const pick = (key) => String(env[key] ?? "");

  const config = {
    FIREBASE_API_KEY: pick("FIREBASE_API_KEY"),
    FIREBASE_AUTH_DOMAIN: pick("FIREBASE_AUTH_DOMAIN"),
    FIREBASE_PROJECT_ID: pick("FIREBASE_PROJECT_ID"),
    FIREBASE_APP_ID: pick("FIREBASE_APP_ID"),
    WATCH_URL: pick("WATCH_URL") || "https://watch.arkia.buzz/web/",
    WATCH_USERNAME: pick("WATCH_USERNAME"),
    WATCH_PASSWORD: pick("WATCH_PASSWORD")
  };

  return new Response("window.__ENV = " + JSON.stringify(config) + ";", {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      // The values change with the deployment, so never let a stale copy stick.
      "cache-control": "no-store"
    }
  });
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === "/env.js") return envScript(env);
    return env.ASSETS.fetch(request);
  }
};
