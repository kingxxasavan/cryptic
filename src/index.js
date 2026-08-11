// Cryptic Hub Worker.
//
// Everything in public/ is served as a static asset. The one dynamic route is
// /env.js, which is generated from the Worker's environment variables so the
// Firebase keys live in Cloudflare rather than in the source tree.
//
// public/env.js exists as a blank local-dev fallback; run_worker_first in
// wrangler.jsonc makes this handler win for that path in production.

// Variable names get typed by hand in the dashboard, so match them loosely:
// case, spaces, dashes, underscores and a missing "FIREBASE" prefix all still
// resolve. "firebase api key", "FIREBASE_API_KEY" and "apiKey" are one key.
const norm = (s) => String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");

const ALIASES = {
  FIREBASE_API_KEY: ["FIREBASEAPIKEY", "APIKEY", "FIREBASEKEY"],
  FIREBASE_AUTH_DOMAIN: ["FIREBASEAUTHDOMAIN", "AUTHDOMAIN"],
  FIREBASE_PROJECT_ID: ["FIREBASEPROJECTID", "PROJECTID"],
  FIREBASE_APP_ID: ["FIREBASEAPPID", "APPID"],
  WATCH_URL: ["WATCHURL"],
  WATCH_USERNAME: ["WATCHUSERNAME", "WATCHUSER"],
  WATCH_PASSWORD: ["WATCHPASSWORD", "WATCHPASS"]
};

// Only string-valued entries are candidates; bindings like ASSETS are objects.
function lookup(env, field) {
  const wanted = ALIASES[field];
  for (const [key, value] of Object.entries(env)) {
    if (typeof value !== "string") continue;
    if (wanted.includes(norm(key))) return value.trim();
  }
  return "";
}

function readConfig(env) {
  const config = {};
  for (const field of Object.keys(ALIASES)) config[field] = lookup(env, field);
  if (!config.WATCH_URL) config.WATCH_URL = "https://watch.arkia.buzz/web/";
  return config;
}

function envScript(env) {
  return new Response("window.__ENV = " + JSON.stringify(readConfig(env)) + ";", {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      // The values change with the deployment, so never let a stale copy stick.
      "cache-control": "no-store"
    }
  });
}

// Diagnostic for "the keys are missing" when you believe you set them.
// Reports which fields resolved and what variable names this Worker can see —
// names only, never values, so it stays safe to open in a browser.
function envCheck(env) {
  const config = readConfig(env);
  const required = ["FIREBASE_API_KEY", "FIREBASE_AUTH_DOMAIN", "FIREBASE_PROJECT_ID"];

  const body = {
    signInWillWork: required.every((f) => config[f]),
    resolved: Object.fromEntries(Object.keys(ALIASES).map((f) => [f, !!config[f]])),
    variableNamesThisWorkerCanSee: Object.entries(env)
      .filter(([, v]) => typeof v === "string")
      .map(([k]) => k)
      .sort()
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/env.js") return envScript(env);
    if (pathname === "/__env-check") return envCheck(env);
    return env.ASSETS.fetch(request);
  }
};
