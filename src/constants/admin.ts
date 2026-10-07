/**
 * Organizer accounts.
 *
 * Kept in sync with the UID allowlist in `firestore.rules`. This copy only
 * decides what the app renders — the rules are what actually enforce access,
 * so adding a UID here alone grants nothing, and removing one doesn't revoke
 * anything until the rules are redeployed.
 */
export const ADMIN_UIDS: readonly string[] = ["c2RWe1f5Yjbod4dKN9d4QLR2HS72",
"356SGO9u2TbVyB8e3hs87oeCgB82",
"zhqpo5vTWPRSKOxLHq7Q4Rn4Cll1",
"2cYN49GlnOVyOdJb2n3Y8KPZYh83",
"RdL2LZmaBjW8CVtSFYW0PAh8Ix83",
"2bV2OErfrsh7tUDGRG3UxQfnyVr1",
"ZxKdV5JlA8Thrp9scDPr0Zf0oGI3",
"H2XQ29hfBkSPbZ0CJONFEpX4c7j1",
"hk9wdv72mTMRx4iCMdRBtZBhFMy1",
"i09axNrJkyMidpOGU4OdClTQwiD3",
"hzh0ISpa4jaABuysMRvKdcFIoEr1",
"fGdqf16PfbghnIdokQhyvwXD8a83",
"JVKF1yUFXng4mGxJAGUfZtc86tw2"];

export function isAdmin(uid: string | null | undefined): boolean {
  return typeof uid === "string" && ADMIN_UIDS.includes(uid);
}
