import type { AppError } from "@/types";

function getCode(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return "unknown";
}

export function isPermissionDenied(err: unknown): boolean {
  return getCode(err) === "permission-denied";
}

/** Converts any thrown value into a delegate-friendly error. Never surfaces raw Firebase text. */
export function toAppError(err: unknown, fallback: string): AppError {
  const code = getCode(err);
  if (import.meta.env.DEV) console.warn("[gmun]", code, err);

  switch (code) {
    case "unavailable":
    case "auth/network-request-failed":
      return { code, message: "You appear to be offline. Check your connection and try again." };
    case "permission-denied":
      return { code, message: "You don't have access to this yet. Please contact the organizers." };
    case "unauthenticated":
      return { code, message: "Your session has expired. Please sign in again." };
    case "resource-exhausted":
      return { code, message: "The portal is busy right now. Please try again in a moment." };
    default:
      return { code, message: fallback };
  }
}

const AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "That email and password don't match. Please try again.",
  "auth/wrong-password": "That email and password don't match. Please try again.",
  "auth/user-not-found": "That email and password don't match. Please try again.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/missing-password": "Please enter your password.",
  "auth/user-disabled": "This account has been disabled. Please contact the organizers.",
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
  "auth/network-request-failed": "You appear to be offline. Check your connection and try again.",
};

export function authErrorMessage(err: unknown): string {
  const code = getCode(err);
  if (import.meta.env.DEV) console.warn("[gmun:auth]", code);
  return AUTH_MESSAGES[code] ?? "We couldn't sign you in. Please try again.";
}
