/**
 * _auth.tsx — Pathless layout route that guards ALL authority routes.
 *
 * NAMING CONVENTION: The underscore prefix makes this a "pathless layout route"
 * in TanStack Router file-based routing. It adds NO URL segment but wraps
 * every child route whose filename starts with "_auth." or lives in "_auth/".
 *
 * ROUTES UNDER THIS LAYOUT:
 *   _auth.ward.tsx      → /ward        (WARD_STAFF only)
 *   _auth.police.tsx    → /police      (POLICE only)
 *   _auth.city-admin.tsx → /city-admin (SUPER_ADMIN only)
 *   _auth.assistant.tsx  → /assistant  (all AUTHORITY_ROLES)
 *
 * SECURITY MODEL:
 *   - beforeLoad runs BEFORE any child route renders.
 *   - If the user is not authenticated → redirect to /login.
 *   - If the user is authenticated but is a CITIZEN → force logout + redirect.
 *     (Cross-portal token escalation attack prevention.)
 *   - Each child route additionally checks its OWN allowed roles
 *     (defense in depth: two independent checks).
 */

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getToken } from "@/lib/api";
import { AUTHORITY_ROLES, CITIZEN_ROLES, parseBackendRole } from "@/lib/roles";

export const Route = createFileRoute("/_auth")({
  /**
   * beforeLoad runs on the server (SSR) and on every client-side navigation.
   * This is NOT a React hook — it runs before the component tree renders.
   *
   * We read auth from localStorage here (transitional state).
   * Once httpOnly cookies are in place, replace with: fetch("/api/auth/me")
   */
  beforeLoad: async () => {
    console.log("=== [_auth] Authentication Check Started ===");

    // ── Read stored session ──────────────────────────────────
    // Ensure we're in browser environment
    if (typeof window === "undefined") {
      console.log("[_auth] SSR environment detected");
      return;
    }

    const token = getToken();
    const raw = localStorage.getItem("dn_auth_user_v2");

    console.log("[_auth] Token exists:", !!token, token ? `(${token.substring(0, 15)}...)` : "");
    console.log("[_auth] User data exists:", !!raw);
    if (raw) {
      console.log("[_auth] Raw user data:", raw);
    }

    // ── 1. Not authenticated ─────────────────────────────────
    if (!token || !raw) {
      console.warn("❌ [_auth] Authentication FAILED - Missing credentials");
      console.log("[_auth] Token present:", !!token);
      console.log("[_auth] User data present:", !!raw);
      throw redirect({ to: "/authority-login", search: { redirect: undefined, error: undefined } });
    }

    let user: {
      name: string;
      role: string;
      org: string;
      wardName?: string | null;
      wardType?: string | null;
      wardId?: number | null;
      token?: string;
    } | null = null;
    try {
      user = JSON.parse(raw);
      console.log("[_auth] Parsed user:", { name: user?.name, role: user?.role, org: user?.org });

      if (!user || !user.role) {
        console.error("❌ [_auth] Invalid user data structure");
        throw new Error("Invalid user data");
      }
    } catch (e) {
      console.error("❌ [_auth] Failed to parse user data:", e);
      localStorage.removeItem("dn_auth_user_v2");
      localStorage.removeItem("dn_jwt_token");
      throw redirect({ to: "/authority-login", search: { redirect: undefined, error: undefined } });
    }

    const role = parseBackendRole(user.role);
    console.log("[_auth] Parsed role:", role);

    // ── 2. SECURITY: Cross-portal escalation check ───────────
    if (CITIZEN_ROLES.has(role)) {
      console.warn("❌ [_auth] SECURITY: Citizen role detected in authority portal");
      localStorage.removeItem("dn_auth_user_v2");
      localStorage.removeItem("dn_jwt_token");
      throw redirect({ to: "/authority-login", search: { redirect: undefined, error: "forbidden" } });
    }

    // ── 3. Confirmed authority user — inject into context ────
    console.log("✅ [_auth] Authentication SUCCESS -", user.name, "as", role);
    console.log("=== [_auth] Authentication Check Complete ===\n");

    return {
      currentUser: {
        name: user.name,
        role,
        org: user.org ?? "",
        wardName: user.wardName ?? null,
        wardType: user.wardType ?? null,
        wardId: user.wardId ?? null,
      },
    };
  },

  // The layout component — children render via <Outlet />
  component: AuthLayout,
});

function AuthLayout() {
  return <Outlet />;
}
