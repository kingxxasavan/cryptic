# Cryptic Hub — deploying to Cloudflare Pages

## Files

| File | What it does |
| --- | --- |
| `index.html` | The app |
| `support.js` | Runtime the app loads |
| `firebase-auth.js` | Firebase Authentication (email/password + Google), session persists across visits |
| `env.js` | Local fallback config — replaced at runtime on Cloudflare |
| `functions/env.js.js` | Pages Function that serves `/env.js` from environment variables |

## Deploy

1. Upload this folder to Cloudflare Pages (direct upload, or push to a repo and connect it). No build command, output directory `/`.
2. In **Pages → Settings → Environment variables**, add:

```
FIREBASE_API_KEY       AIza…
FIREBASE_AUTH_DOMAIN   your-project.firebaseapp.com
FIREBASE_PROJECT_ID    your-project
FIREBASE_APP_ID        1:123…:web:abc…
WATCH_URL              https://watch.arkia.buzz/web/
WATCH_USERNAME         guest
WATCH_PASSWORD         guest
```

3. Redeploy. `functions/env.js.js` serves those values at `/env.js`, so the keys live in Cloudflare, not in the source.
4. In the Firebase console, under **Authentication → Settings → Authorised domains**, add your Pages domain (`*.pages.dev` and any custom domain). Enable the **Email/Password** and **Google** sign-in providers.

## Notes

- The Firebase web API key is not a secret — it identifies the project. Access is controlled by Firebase security rules and the authorised-domain list.
- Sessions use `browserLocalPersistence`: once someone signs in, they stay signed in on that device until they sign out.
- Without Firebase keys the app still runs, but sign-in is disabled — nothing can verify a password, so the dialog says the keys are missing rather than letting anyone through.
- Settings → Firebase is a local fallback for testing. Cloudflare environment values always take priority.
