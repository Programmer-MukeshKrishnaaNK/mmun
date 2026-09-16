// Single Firebase initialisation for the whole app — migrated from the original
// firebase-config.js. Import `auth` from here and `db` from "@/lib/db"; never
// re-initialise. Firestore lives in its own module so the login page doesn't
// have to download it.
//
// This is the standard public web client config. It is not a secret: access is
// enforced by Firebase Auth + Firestore security rules. Never add service
// account keys or admin credentials to frontend code.
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBhQ-gK1DDLHoxplAgJ8azmPP1avUiOupo",
  authDomain: "gmun-16524.firebaseapp.com",
  projectId: "gmun-16524",
  storageBucket: "gmun-16524.firebasestorage.app",
  messagingSenderId: "953312071097",
  appId: "1:953312071097:web:249f89c59e98022829ba68",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
