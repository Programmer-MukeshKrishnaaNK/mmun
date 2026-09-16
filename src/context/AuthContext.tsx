import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { observeAuth, type AuthUser } from "@/services/auth";

interface AuthState {
  user: AuthUser | null;
  /** True until Firebase has restored (or ruled out) a persisted session. */
  initializing: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, initializing: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, initializing: true });

  useEffect(() => observeAuth((user) => setState({ user, initializing: false })), []);

  return <AuthContext value={state}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
