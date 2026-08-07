// Who is allowed to change the directory.
//
// Editing (edit mode, add site, import bookmarks, delete a row) is limited to
// the accounts listed here. Everyone else — signed in or not — gets a
// read-only directory and never sees the controls.
//
// Set VITE_ADMIN_EMAILS to a comma-separated list to change the roster without
// touching this file (see .env.example).
const DEFAULT_ADMINS = "kingfan837@gmail.com";

export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || DEFAULT_ADMINS)
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

/**
 * True only for a signed-in account whose (verified) address is on the list.
 *
 * This is a UI gate, not a security boundary — it decides what the browser
 * draws. Once the directory is backed by a real database, the same list has to
 * be enforced server-side too, in Firebase security rules.
 */
export function isAdmin(user) {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}
