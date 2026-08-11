# Cryptic Hub — deploying to Cloudflare Workers

## Files

| File | What it does |
| --- | --- |
| `public/index.html` | The app |
| `public/support.js` | Runtime the app loads |
| `public/firebase-auth.js` | Firebase Authentication (email/password + Google), session persists across visits |
| `public/env.js` | Blank local-dev fallback — the Worker serves `/env.js` instead in production |
| `src/index.js` | The Worker: serves `/env.js` from environment variables, everything else from `public/` |
| `wrangler.jsonc` | Worker name, entry point, and static-asset config |

## Deploy

1. Connect this repo to a Worker in the Cloudflare dashboard (**Workers & Pages → your Worker → Settings → Builds**). No build command is needed; the deploy command is `npx wrangler deploy` on the production branch and `npx wrangler versions upload` on other branches.
2. Set `name` in `wrangler.jsonc` to your Worker's actual name, or the build will target the wrong Worker.
3. In **Worker → Settings → Variables and Secrets**, add:

```
FIREBASE_API_KEY       AIza…
FIREBASE_AUTH_DOMAIN   your-project.firebaseapp.com
FIREBASE_PROJECT_ID    your-project
FIREBASE_APP_ID        1:123…:web:abc…
WATCH_URL              https://watch.arkia.buzz/web/
WATCH_USERNAME         guest
WATCH_PASSWORD         guest
```

4. Redeploy. `src/index.js` serves those values at `/env.js`, so the keys live in Cloudflare, not in the source. Check by loading `/env.js` in a browser — it should show your real values, not empty strings.

   Variable names are matched loosely — case, spaces, dashes and underscores are ignored, and the `FIREBASE` prefix is optional — so `FIREBASE_API_KEY`, `firebase api key` and `apiKey` all work.

   If sign-in still says the keys are missing, open **`/__env-check`**. It reports which fields resolved and lists the variable names this Worker can actually see (names only, never values).

   If `variableNamesThisWorkerCanSee` is empty, the Worker is getting nothing at runtime. Three things cause that:

   - **The variables are build variables.** Workers Builds has its own *Build variables and secrets* under Settings → Builds, separate from the runtime ones. Build variables exist only while the build runs and never reach the Worker. The keys must be in **Settings → Variables and Secrets**.
   - **A deploy wiped them.** `wrangler deploy` deletes dashboard variables that this config file does not declare. `keep_vars: true` in `wrangler.jsonc` prevents that; re-add the variables once after setting it. Storing them as Secrets rather than plain-text variables also survives deploys.
   - **They are on a different Worker or environment.** Check `name` in `wrangler.jsonc`, and note that preview versions do not see variables scoped to production only.
5. In the Firebase console, under **Authentication → Settings → Authorised domains**, add your Worker's domain (`*.workers.dev` and any custom domain). Enable the **Email/Password** and **Google** sign-in providers.

## Local development

```
npx wrangler dev
```

Serves the app on `localhost:8787` with `/env.js` built from your local vars. Add keys with `--var FIREBASE_API_KEY:…`, or put them in a `.dev.vars` file.

## Notes

- The Firebase web API key is not a secret — it identifies the project. Access is controlled by Firebase security rules and the authorised-domain list.
- Sessions use `browserLocalPersistence`: once someone signs in, they stay signed in on that device until they sign out.
- Without Firebase keys the app still runs, but sign-in is disabled — nothing can verify a password, so the dialog says the keys are missing rather than letting anyone through.
- Settings → Firebase is a local fallback for testing. Cloudflare environment values always take priority.
