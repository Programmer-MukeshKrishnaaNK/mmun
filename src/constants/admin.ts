/**
 * Organizer accounts.
 *
 * Kept in sync with the UID allowlist in `firestore.rules`. This copy only
 * decides what the app renders — the rules are what actually enforce access,
 * so adding a UID here alone grants nothing, and removing one doesn't revoke
 * anything until the rules are redeployed.
 */
export const ADMIN_UIDS: readonly string[] = [
        "d5Ll4Pqi2jf58DP8xSa8VwdqfDB3","4bVAMM4FZDSotHDVUsBb8OASZ5w1","8mBzItdZ5HRX2GYkV98aJjImP2u1","GbyOFSuxQseenEfoDNdw3s2mbF22",
        "IxwNTcwWJNaJXoTYIeDJpmYEKy52","CKQNBeC8MPfFPfaRSnc1SKf5Xat2","QUOVJY1sjASJbS7cjWgk3mmRPMD2","qzae9XLkscbafF4ASi0UOYpYIgz1",
        "OW4fqad4xnQxlM60FEej4FsC0u62","Enjh9ZSJnacr8emlnCOFNn1Ah0r1"
      ];

export function isAdmin(uid: string | null | undefined): boolean {
  return typeof uid === "string" && ADMIN_UIDS.includes(uid);
}
