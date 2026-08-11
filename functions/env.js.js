// Cloudflare Pages Function: serves /env.js from the project's environment
// variables so the keys live in Cloudflare rather than in the source tree.
// Any variable left unset comes through as an empty string, which the app
// treats the same as "not configured".
export function onRequest(context) {
  const env = context.env || {};
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
