// Firebase app singleton for Cryptic Hub.
//
// The values below are the project's *public* web config — Firebase expects
// them to ship in the client bundle, and access is controlled by Auth settings
// and security rules, not by hiding these keys. Every value can still be
// overridden per environment with the matching VITE_FIREBASE_* variable
// (see .env.example) so a fork can point at its own project without a patch.
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyC3e8T0nsoyey0EA9ozQbt9o5THI4pGzng",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "arikia.firebaseapp.com",
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || "https://arikia-default-rtdb.firebaseio.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "arikia",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "arikia.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "472996212961",
  appId: env.VITE_FIREBASE_APP_ID || "1:472996212961:web:d6a53311c8d281f97507a0",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-03BY83C2TV"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Keep the session across reloads and tabs. Failure here is not fatal — Auth
// falls back to in-memory persistence (e.g. Safari private mode).
export const persistenceReady = setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("[cryptic] falling back to in-memory auth persistence:", err && err.code);
});

// Analytics needs a browser with cookies/IndexedDB and a measurementId, and it
// only has anything useful to say on the deployed site — running it against
// localhost just fills the console with blocked-request noise. Never let it
// break the app.
const analyticsWanted =
  env.PROD &&
  !!firebaseConfig.measurementId &&
  typeof location !== "undefined" &&
  location.protocol === "https:";

export const analyticsReady = (analyticsWanted ? isSupported() : Promise.resolve(false))
  .then((ok) => (ok ? getAnalytics(app) : null))
  .catch((err) => {
    console.warn("[cryptic] analytics unavailable:", err && err.message);
    return null;
  });
