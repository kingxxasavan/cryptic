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
3. Fill in the four Firebase values in the `vars` block of `wrangler.jsonc`. Copy them from the Firebase console under **Project settings → General → Your apps → SDK setup and configuration**. Commit and push; the build picks them up.
4. For real credentials — the watch username and password — use **Worker → Settings → Variables and Secrets** instead, so they stay out of the repo. `keep_vars: true` stops deploys from clearing them.
5. In the Firebase console, under **Authentication → Settings → Authorised domains**, add your Worker's domain (`*.workers.dev` and any custom domain). Enable the **Email/Password** and **Google** sign-in providers.

### Why the Firebase keys are committed

The Firebase web config is not a secret. Every visitor's browser receives it — that is how the client SDK works, and it was equally true when these values came from environment variables. Access is controlled by the authorised-domain list and Firebase security rules, not by hiding the strings.

Keeping them in `wrangler.jsonc` means preview builds and production behave identically. Environment variables do not: `wrangler versions upload`, which runs for non-production branches, builds a version's bindings from this config file alone, so dashboard variables never reach a preview URL.

### If sign-in says the keys are missing

Open **`/__env-check`**. It reports which fields resolved and lists the variable names the Worker can see (names only, never values).

- **Names listed but a field is `false`** — that value is blank in `wrangler.jsonc`, or the name is one the Worker does not recognise. Names are matched loosely: case, spaces, dashes and underscores are ignored and the `FIREBASE` prefix is optional, so `FIREBASE_API_KEY`, `firebase api key` and `apiKey` are the same key.
- **The list is empty** — the Worker is getting nothing at runtime. Either the `vars` block is missing from `wrangler.jsonc`, or you are relying on dashboard variables that this deploy does not include. Note that Workers Builds also has its own *Build variables* under Settings → Builds; those exist only while the build runs and never reach the Worker.
- **`signInWillWork: true` but sign-in still fails** — the config is fine and the problem is Firebase-side. Check that the domain you are loading is in the authorised-domain list, and that the Email/Password provider is enabled.

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
