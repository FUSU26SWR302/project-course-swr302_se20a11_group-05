/**
 * guardUtils.ts — Reusable beforeLoad auth guard for TanStack Router.
 *
 * SECURITY DESIGN:
 *   1. assertAuth() must be called in `beforeLoad` — not in component render.
 *      TanStack Router runs beforeLoad BEFORE any JSX renders, preventing
 *      any flash of protected content — even for 1 frame.
 *
 *   2. We check auth state via the AuthContext stored in the router context
 *      (hydrated by AuthProvider on mount). For SSR-first validation, wire
 *      this to a GET /api/auth/me call once httpOnly cookies are in place.
 *
 *   3. Cross-portal role escalation:
 *      - A CITIZEN token reaching an authority route → force logout + redirect.
 *      - An authority token on a citizen-only route → redirect (not a threat).
 *
 *   4. `throw redirect(...)` is TanStack Router's idiomatic pattern.
 *      It aborts the navigation and performs a new navigation atomically.
 *      No component renders between the check and the redirect.
 */

import { redirect } from "@tanstack/react-router";
import { Role, AUTHORITY_ROLES, CITIZEN_ROLES, type Role as RoleType } from "./roles";

// ─── Types ───────────────────────────────────────────────────

export interface GuardedUser {
  name: string;
  role: RoleType;
  org: string;
}

export interface AuthGuardOptions {
  /** Roles that may access this route */
  allowedRoles: RoleType[];
  /** Login page URL for this portal */
  loginUrl: string;
  /** Which portal this guard belongs to — determines cross-portal behavior */
  portal: "citizen" | "authority";
}

// ─── Core Guard Function ─────────────────────────────────────

/**
 * Call this inside TanStack Router's `beforeLoad` context.
 * Reads current user from localStorage auth (transitional; migrate to cookie).
 *
 * Usage:
 *   beforeLoad: async ({ context }) => {
 *     const user = await assertAuth(context.auth, {
 *       allowedRoles: [Role.WARD_STAFF],
 *       loginUrl: "/login",
 *       portal: "authority",
 *     });
 *     return { currentUser: user };
 *   }
 *
 * @throws TanStack Router redirect — caught by the router, not catchable in components.
 */
export function assertAuth(
  auth: { user: GuardedUser | null; isAuthenticated: boolean; logout: () => void },
  opts: AuthGuardOptions,
): GuardedUser {
  const { user, isAuthenticated } = auth;

  // ── 1. Not authenticated at all ──────────────────────────────
  if (!isAuthenticated || !user) {
    throw redirect({
      to: opts.loginUrl as any,
      search: {
        redirect: typeof window !== "undefined" ? window.location.pathname : undefined,
        error: undefined,
      } as any,
    });
  }

  // ── 2. Cross-portal role escalation check ────────────────────
  //
  // SECURITY: If a CITIZEN token somehow reaches an authority route,
  // we must not just redirect — we must force logout to clear the session.
  // This handles the case where a citizen bookmarks an authority URL.
  if (opts.portal === "authority" && CITIZEN_ROLES.has(user.role)) {
    // Citizen trying to access authority portal — purge session & redirect
    auth.logout();
    throw redirect({
      to: opts.loginUrl as any,
      search: { redirect: undefined, error: "forbidden" } as any,
    });
  }

  // Authority staff hitting a citizen-only route is not a threat —
  // they probably clicked a public link. Just redirect to their portal.
  if (opts.portal === "citizen" && AUTHORITY_ROLES.has(user.role)) {
    throw redirect({ to: "/login", search: { redirect: undefined, error: undefined } });
  }

  // ── 3. Route-level role check ────────────────────────────────
  //
  // The user is authenticated for the correct portal, but may not have
  // the specific role required by this route (e.g. POLICE trying /ward).
  if (!opts.allowedRoles.includes(user.role)) {
    // Redirect to generic dashboard — don't expose that route exists
    throw redirect({
      to: opts.loginUrl as any,
      search: { redirect: undefined, error: "forbidden" } as any,
    });
  }

  // ── 4. All checks passed — return user for route context ─────
  return user;
}

// ─── Convenience Guard Factories ─────────────────────────────

/** Guard factory for authority routes — pass specific allowed roles */
export function authorityGuard(allowedRoles: RoleType[]) {
  return {
    allowedRoles,
    loginUrl: "/authority-login" as const,
    portal: "authority" as const,
  };
}

/** Guard factory for citizen-only routes */
export function citizenGuard() {
  return {
    allowedRoles: [Role.CITIZEN] as RoleType[],
    loginUrl: "/login" as const,
    portal: "citizen" as const,
  };
}
