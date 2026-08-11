// Runtime config for Cryptic Hub, loaded by index.html before firebase-auth.js.
//
// The Firebase web config is not a secret: the browser needs it to talk to
// Firebase at all, so it is public on any deployment. The project is protected
// by the authorised-domain list (Firebase console → Authentication → Settings)
// and by security rules, not by hiding these values.
//
// WATCH_URL points at the Jellyfin server behind the Cloudflare Tunnel.
window.__ENV = {
  FIREBASE_API_KEY: "AIzaSyC3e8T0nsoyey0EA9ozQbt9o5THI4pGzng",
  FIREBASE_AUTH_DOMAIN: "arikia.firebaseapp.com",
  FIREBASE_PROJECT_ID: "arikia",
  FIREBASE_APP_ID: "1:472996212961:web:d6a53311c8d281f97507a0",
  WATCH_URL: "https://watch.arkia.buzz/web/",
  WATCH_USERNAME: "",
  WATCH_PASSWORD: ""
};
