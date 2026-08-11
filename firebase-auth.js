// Firebase Authentication for Cryptic Hub.
// Config comes from window.__ENV (Cloudflare env vars via /env.js), falling
// back to whatever the admin saved in Settings → Firebase (local storage).
const CDN = "https://www.gstatic.com/firebasejs/10.12.5/";
const SETTINGS_STORE = "crypticHub.v1";

function readConfig() {
  const e = window.__ENV || {};
  let saved = {};
  try { saved = (JSON.parse(localStorage.getItem(SETTINGS_STORE) || "{}") || {}).firebase || {}; } catch (err) {}
  const cfg = {
    apiKey: e.FIREBASE_API_KEY || saved.apiKey || "",
    authDomain: e.FIREBASE_AUTH_DOMAIN || saved.authDomain || "",
    projectId: e.FIREBASE_PROJECT_ID || saved.projectId || "",
    appId: e.FIREBASE_APP_ID || saved.appId || ""
  };
  cfg.ok = !!(cfg.apiKey && cfg.authDomain && cfg.projectId);
  return cfg;
}

const listeners = new Set();
let ready = null;
let auth = null;
let sdk = null;
let lastUser = null;
let configured = false;

async function boot() {
  const cfg = readConfig();
  configured = cfg.ok;
  if (!cfg.ok) return null;
  const [{ initializeApp }, authMod] = await Promise.all([
    import(CDN + "firebase-app.js"),
    import(CDN + "firebase-auth.js")
  ]);
  sdk = authMod;
  const app = initializeApp({
    apiKey: cfg.apiKey, authDomain: cfg.authDomain,
    projectId: cfg.projectId, appId: cfg.appId
  });
  auth = sdk.getAuth(app);
  // browserLocalPersistence: the session survives closing the tab or browser.
  await sdk.setPersistence(auth, sdk.browserLocalPersistence);
  sdk.onAuthStateChanged(auth, (user) => {
    lastUser = user ? { uid: user.uid, email: user.email || "", name: user.displayName || "" } : null;
    listeners.forEach(fn => fn(lastUser));
  });
  return auth;
}

function init() {
  if (!ready) ready = boot().catch((err) => { console.warn("[firebase] init failed:", err.message); return null; });
  return ready;
}

function friendly(err) {
  const code = (err && err.code) || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "That email and password don't match an account.";
  if (code.includes("email-already-in-use")) return "That email already has an account — sign in instead.";
  if (code.includes("weak-password")) return "Password needs at least 6 characters.";
  if (code.includes("invalid-email")) return "That email address doesn't look right.";
  if (code.includes("too-many-requests")) return "Too many attempts. Try again in a minute.";
  if (code.includes("network")) return "Couldn't reach Firebase. Check the connection.";
  if (code.includes("popup-closed")) return "Google sign-in was closed before it finished.";
  if (code.includes("unauthorized-domain")) return "This domain isn't in the Firebase authorised list. Add it under Authentication → Settings.";
  return (err && err.message) || "Sign-in failed.";
}

window.CrypticAuth = {
  init,
  isConfigured: () => { readConfig(); return configured || readConfig().ok; },
  current: () => lastUser,
  onChange(fn) { listeners.add(fn); if (lastUser) fn(lastUser); return () => listeners.delete(fn); },
  async signIn(email, password) {
    await init();
    if (!auth) throw new Error("Firebase isn't configured yet.");
    try {
      const res = await sdk.signInWithEmailAndPassword(auth, email, password);
      return { uid: res.user.uid, email: res.user.email || "", name: res.user.displayName || "" };
    } catch (err) { throw new Error(friendly(err)); }
  },
  async signUp(email, password, name) {
    await init();
    if (!auth) throw new Error("Firebase isn't configured yet.");
    try {
      const res = await sdk.createUserWithEmailAndPassword(auth, email, password);
      if (name) await sdk.updateProfile(res.user, { displayName: name });
      return { uid: res.user.uid, email: res.user.email || "", name: name || "" };
    } catch (err) { throw new Error(friendly(err)); }
  },
  async signInWithGoogle() {
    await init();
    if (!auth) throw new Error("Firebase isn't configured yet.");
    try {
      const res = await sdk.signInWithPopup(auth, new sdk.GoogleAuthProvider());
      return { uid: res.user.uid, email: res.user.email || "", name: res.user.displayName || "" };
    } catch (err) { throw new Error(friendly(err)); }
  },
  async signOut() { await init(); if (auth) await sdk.signOut(auth); }
};

init();
