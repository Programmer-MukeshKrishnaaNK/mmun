import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Unsubscribe } from "@/types";

export type AuthUser = User;

export function observeAuth(callback: (user: AuthUser | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/** Throws the Firebase error; map it with `authErrorMessage` for display. */
export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}
