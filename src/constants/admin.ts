/**
 * Organizer accounts.
 *
 * Kept in sync with the UID allowlist in `firestore.rules`. This copy only
 * decides what the app renders — the rules are what actually enforce access,
 * so adding a UID here alone grants nothing, and removing one doesn't revoke
 * anything until the rules are redeployed.
 */
export const ADMIN_UIDS: readonly string[] = ["7cIMzT67tsVWOIZUVlTRi8n28gl1"];

export function isAdmin(uid: string | null | undefined): boolean {
  return typeof uid === "string" && ADMIN_UIDS.includes(uid);
}
