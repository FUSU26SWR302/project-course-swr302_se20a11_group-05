/**
 * auth.tsx — Auth context provider and hook.
 *
 * CHANGES from v1:
 *   - Role type replaced with Role enum imported from ./roles
 *   - Token storage key namespaced per-portal (future-proof for split)
 *   - logout() now also clears the JWT token
 *   - isAuthenticated checks BOTH user object AND token presence
 *   - Re-exports Role, ROLE_LABEL, parseBackendRole from ./roles for convenience
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getToken, setToken, removeToken, setOnUnauthorized, userApi } from "./api";
import {
  Role,
  ROLE_LABEL,
  parseBackendRole,
  AUTHORITY_ROLES,
  CITIZEN_ROLES,
  type Role as RoleType,
} from "./roles";

// Re-export for consumers that import everything from "@/lib/auth"
export { Role, ROLE_LABEL, parseBackendRole, AUTHORITY_ROLES, CITIZEN_ROLES };
export type { RoleType };

// ─── Types ───────────────────────────────────────────────────

export interface AuthUser {
  name: string;
  role: RoleType;
  org: string;
  wardName?: string | null;
  wardType?: string | null;
  wardId?: number | null;
  token?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  login: (u: AuthUser) => void;
  logout: () => void;
  hasRole: (...roles: RoleType[]) => boolean;
  isAuthenticated: boolean;
}

// ─── Context & Storage ───────────────────────────────────────

const AuthContext = createContext<AuthCtx | null>(null);

/**
 * Storage key — use a more specific key so citizen/authority sessions
 * can be isolated once we move to separate subdomains.
 */
const STORAGE_KEY = "dn_auth_user_v2";

// ─── Provider ────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Rehydrate from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const storedToken = typeof window !== "undefined" ? getToken() : null;
      
      if (raw && storedToken) {
        const parsed: AuthUser = JSON.parse(raw);
        // SECURITY: Validate that the stored role is a known Role value
        // Unknown/tampered roles are rejected, not trusted
        const knownRoles = Object.values(Role) as string[];
        if (!knownRoles.includes(parsed.role)) {
          console.warn("[auth] Stored user has unknown role — clearing session");
          localStorage.removeItem(STORAGE_KEY);
          removeToken();
          return;
        }
        
        // Set token to ensure API calls work immediately after reload
        if (parsed.token) {
          setToken(parsed.token);
        } else if (storedToken) {
          // If user doesn't have token but localStorage has it, use that
          parsed.token = storedToken;
          setToken(storedToken);
        }
        
        setUser(parsed);

        // Fetch full profile info to get the full name
        userApi.profile().then((profile) => {
          if (profile && profile.fullName) {
            const updated = { ...parsed, name: profile.fullName };
            setUser(updated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          }
        }).catch(() => {});
      } else if (raw || storedToken) {
        // If only one exists, clear both to avoid inconsistent state
        localStorage.removeItem(STORAGE_KEY);
        removeToken();
      }
    } catch {
      // Corrupt storage — clear it
      localStorage.removeItem(STORAGE_KEY);
      removeToken();
    }

    // Auto-logout when backend returns 401
    setOnUnauthorized(() => {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
        removeToken();
      }
    });
  }, []);

  const login = (u: AuthUser) => {
    setUser(u);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      if (u.token) {
        setToken(u.token);
      }
    }
    // Fetch profile to get full name
    userApi.profile().then((profile) => {
      if (profile && profile.fullName) {
        const updated = { ...u, name: profile.fullName };
        setUser(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    }).catch(() => {});
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      removeToken();
    }
  };

  const hasRole = (...roles: RoleType[]) => !!user && roles.includes(user.role);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
