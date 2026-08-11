# Cryptic Hub

A static site — plain HTML and JavaScript, no build step.

## Files

| File | What it does |
| --- | --- |
| `index.html` | The app |
| `support.js` | Runtime the app loads |
| `firebase-auth.js` | Firebase Authentication (email/password + Google), session persists across visits |
| `env.js` | Firebase config and the watch-library URL |

## Deploy (Vercel)

Import the repo at [vercel.com/new](https://vercel.com/new). There is no framework and no build step, so accept the defaults: framework preset **Other**, build command empty, output directory the repository root.

Then, in the Firebase console under **Authentication → Settings → Authorised domains**, add the Vercel domain (`your-project.vercel.app` and any custom domain). Sign-in fails with an unauthorised-domain error until this is done. Make sure the **Email/Password** and **Google** providers are enabled under Authentication → Sign-in method.

To run it locally, any static file server works:

```
python3 -m http.server 8000
```

## Configuration

Everything lives in `env.js`. Edit it and redeploy.

The Firebase web config is public by design — the browser cannot authenticate without it, so it is visible on any deployment regardless of where it is stored. What protects the project is the authorised-domain list and the Firebase security rules, so keep that domain list limited to domains you control.

Because of that, do not put real credentials in `env.js`. `WATCH_USERNAME` and `WATCH_PASSWORD` are left blank for that reason: anything placed there is served to every visitor.

## The watch library

`WATCH_URL` points at the Jellyfin server exposed through the Cloudflare Tunnel at `watch.arkia.buzz`. The tunnel is configured outside this repo; the app only links to it, so hosting the site on Vercel does not affect it.

## Notes

- Sessions use `browserLocalPersistence`: once someone signs in, they stay signed in on that device until they sign out.
- Without Firebase keys the app still runs, but sign-in is disabled — nothing can verify a password, so the dialog says the keys are missing rather than letting anyone through.
- Settings → Firebase is a local override for testing. Values in `env.js` take priority.
