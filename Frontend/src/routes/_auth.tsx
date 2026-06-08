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
    // ── Read stored session ──────────────────────────────────
    const token = typeof window !== "undefined" ? getToken() : null;
    const raw = typeof window !== "undefined"
      ? localStorage.getItem("dn_auth_user_v2")
      : null;

    // ── 1. Not authenticated ─────────────────────────────────
    if (!token || !raw) {
      throw redirect({ to: "/login" });
    }

    let user: { name: string; role: string; org: string } | null = null;
    try {
      user = JSON.parse(raw);
    } catch {
      // Corrupt storage → clear and redirect
      localStorage.removeItem("dn_auth_user_v2");
      throw redirect({ to: "/login" });
    }

    if (!user) throw redirect({ to: "/login" });

    // Normalize role to our enum
    const role = parseBackendRole(user.role);

    // ── 2. SECURITY: Cross-portal escalation check ───────────
    // A CITIZEN token must NEVER access authority routes.
    // Force logout (clear session) then redirect — do NOT just redirect.
    if (CITIZEN_ROLES.has(role)) {
      localStorage.removeItem("dn_auth_user_v2");
      localStorage.removeItem("dn_jwt_token");
      throw redirect({ to: "/login" });
    }

    // ── 3. Confirmed authority user — inject into context ────
    return {
      currentUser: {
        name: user.name,
        role,
        org: user.org ?? "",
      },
    };
  },

  // The layout component — children render via <Outlet />
  component: AuthLayout,
});

function AuthLayout() {
  return <Outlet />;
}
