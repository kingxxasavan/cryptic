// Email/password + Google auth with mandatory email verification.
//
// The rule the rest of the app relies on: a *password* account only counts as
// signed in once its email address is verified. Unverified accounts stay signed
// in at the Firebase level (that is the only way to resend a verification mail
// or re-check the flag) but are published to the UI as signed out.
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile
} from "firebase/auth";
import { auth } from "./firebase.js";

export const MIN_PASSWORD = 8;

const listeners = new Set();
let current = null;
let settled = false;

function isVerified(user) {
  if (!user) return false;
  if (user.emailVerified) return true;
  // Federated providers (Google) vouch for the address themselves.
  return user.providerData.some((p) => p && p.providerId !== "password");
}

function publish(user) {
  current = isVerified(user) ? user : null;
  settled = true;
  for (const fn of listeners) {
    try {
      fn(current);
    } catch (err) {
      console.error("[cryptic] auth listener failed:", err);
    }
  }
}

onAuthStateChanged(auth, publish, (err) => {
  console.error("[cryptic] auth stream error:", err);
  publish(null);
});

/** Subscribe to the verified user. Fires immediately once state is known. */
export function onChange(fn) {
  listeners.add(fn);
  if (settled) fn(current);
  return () => listeners.delete(fn);
}

export function currentUser() {
  return current;
}

/** The signed-in-but-unverified account, if there is one. */
export function pendingUser() {
  const u = auth.currentUser;
  return u && !isVerified(u) ? u : null;
}

function assertCredentials(email, password) {
  if (!email || !email.trim()) throw new AuthError("auth/missing-email");
  if (!password) throw new AuthError("auth/missing-password");
}

class AuthError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

async function sendVerification(user) {
  try {
    await sendEmailVerification(user);
    return true;
  } catch (err) {
    // Firebase throttles repeat sends; that is not worth failing the flow over.
    if (err && err.code === "auth/too-many-requests") return false;
    throw err;
  }
}

/**
 * Create an account, set the display name, and mail a verification link.
 * Returns { status: "verify", email } — the caller must not treat this as a
 * successful sign-in.
 */
export async function signUp({ name, email, password }) {
  assertCredentials(email, password);
  if (password.length < MIN_PASSWORD) throw new AuthError("auth/weak-password");
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const display = (name || "").trim();
  if (display) {
    try {
      await updateProfile(cred.user, { displayName: display });
    } catch (err) {
      console.warn("[cryptic] could not set display name:", err && err.code);
    }
  }
  await sendVerification(cred.user);
  return { status: "verify", email: cred.user.email };
}

/**
 * Sign in with a password. Returns { status: "ok" } when the address is
 * verified, or { status: "unverified", email, resent } when it is not — in
 * which case a fresh verification link has been sent.
 */
export async function signIn({ email, password }) {
  assertCredentials(email, password);
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  if (isVerified(cred.user)) {
    publish(cred.user);
    return { status: "ok" };
  }
  const resent = await sendVerification(cred.user);
  return { status: "unverified", email: cred.user.email, resent };
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  publish(cred.user);
  return { status: "ok" };
}

/** Re-send the verification link to the pending account. */
export async function resendVerification() {
  const user = pendingUser();
  if (!user) throw new AuthError("auth/no-pending-user");
  const sent = await sendVerification(user);
  return { email: user.email, sent };
}

/** Re-read the pending account from the server; true once it is verified. */
export async function refresh() {
  const user = auth.currentUser;
  if (!user) return false;
  await user.reload();
  publish(auth.currentUser);
  return !!current;
}

export async function sendReset(email) {
  if (!email || !email.trim()) throw new AuthError("auth/missing-email");
  await sendPasswordResetEmail(auth, email.trim());
  return { email: email.trim() };
}

export function signOut() {
  return fbSignOut(auth);
}

/** Drop a half-finished sign-in when the user closes the dialog. */
export async function discardPending() {
  if (pendingUser()) await fbSignOut(auth);
}

const MESSAGES = {
  "auth/missing-email": "Enter your email address.",
  "auth/missing-password": "Enter your password.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account uses that email — sign up instead.",
  "auth/wrong-password": "That email and password don't match.",
  "auth/invalid-credential": "That email and password don't match.",
  "auth/invalid-login-credentials": "That email and password don't match.",
  "auth/email-already-in-use": "That email already has an account — sign in instead.",
  "auth/weak-password": `Use at least ${MIN_PASSWORD} characters.`,
  "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
  "auth/network-request-failed": "Network problem — check your connection and retry.",
  "auth/popup-closed-by-user": "The Google window closed before sign-in finished.",
  "auth/cancelled-popup-request": "The Google window closed before sign-in finished.",
  "auth/popup-blocked": "Your browser blocked the Google popup — allow popups and retry.",
  "auth/account-exists-with-different-credential":
    "That email is already registered with a password — sign in with it instead.",
  "auth/unauthorized-domain": "This domain isn't authorised in Firebase Auth settings.",
  "auth/operation-not-allowed": "This sign-in method is turned off in the Firebase console.",
  "auth/no-pending-user": "Sign in again to get a new verification link."
};

/** Firebase error -> a sentence worth showing in the dialog. */
export function describeError(err) {
  const code = err && err.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  if (code) return `Sign-in failed (${code}).`;
  return (err && err.message) || "Something went wrong. Try again.";
}
