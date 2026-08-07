// Entry point. The page itself is a Design Component rendered by
// /vendor/dc-runtime.js, which evaluates the inline `data-dc-script` block in
// index.html. That block is not a module, so the auth API is handed to it on
// `window` — this file is the only bridge between the two worlds.
import * as auth from "./auth.js";
import "./firebase.js";

window.CrypticAuth = {
  MIN_PASSWORD: auth.MIN_PASSWORD,
  onChange: auth.onChange,
  currentUser: auth.currentUser,
  pendingUser: auth.pendingUser,
  signUp: auth.signUp,
  signIn: auth.signIn,
  signInWithGoogle: auth.signInWithGoogle,
  resendVerification: auth.resendVerification,
  refresh: auth.refresh,
  sendReset: auth.sendReset,
  signOut: auth.signOut,
  discardPending: auth.discardPending,
  describeError: auth.describeError
};

window.dispatchEvent(new Event("cryptic-auth-ready"));
