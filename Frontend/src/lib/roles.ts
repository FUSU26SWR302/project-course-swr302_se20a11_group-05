/**
 * roles.ts — Single source of truth for all Role constants.
 *
 * SECURITY RULE: Never use raw role strings like "ward" or "police" anywhere in the app.
 * Always import from this file. Typos become compile errors, not silent runtime bugs.
 *
 * Backend sends UPPER_CASE strings (e.g. "WARD_STAFF", "CITIZEN").
 * Frontend stores/checks them as the same UPPER_CASE via this enum object.
 */

// ─── Role Enum ───────────────────────────────────────────────
export const Role = {
  CITIZEN:     "CITIZEN",
  WARD_STAFF:  "WARD_STAFF",
  POLICE:      "POLICE",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

/** Union type of all valid role values */
export type Role = (typeof Role)[keyof typeof Role];

// ─── Portal Membership ───────────────────────────────────────

/**
 * Roles that belong exclusively to the AUTHORITY portal.
 * Used by AuthGuard to detect cross-portal token misuse.
 */
export const AUTHORITY_ROLES = new Set<Role>([
  Role.WARD_STAFF,
  Role.POLICE,
  Role.SUPER_ADMIN,
]);

/**
 * Roles that belong exclusively to the CITIZEN portal.
 */
export const CITIZEN_ROLES = new Set<Role>([
  Role.CITIZEN,
]);

// ─── Backend → Frontend Mapping ──────────────────────────────

/**
 * The backend may send roles with a "ROLE_" prefix (Spring Security convention).
 * This function normalizes both forms to our Role enum value.
 *
 * Examples:
 *   "ROLE_WARD_STAFF" → Role.WARD_STAFF
 *   "WARD_STAFF"      → Role.WARD_STAFF
 *   "ward"            → Role.CITIZEN  (unknown → safe default)
 */
export function parseBackendRole(raw: string): Role {
  // Strip Spring Security prefix if present
  const normalized = raw.replace(/^ROLE_/, "").toUpperCase();

  // Legacy lowercase frontend role strings (citizen, ward, police, city_admin)
  const legacyMap: Record<string, Role> = {
    CITIZEN:    Role.CITIZEN,
    WARD:       Role.WARD_STAFF,   // old frontend used "ward"
    WARD_STAFF: Role.WARD_STAFF,
    POLICE:     Role.POLICE,
    CITY_ADMIN: Role.SUPER_ADMIN,  // old frontend used "city_admin"
    SUPER_ADMIN: Role.SUPER_ADMIN,
  };

  if (legacyMap[normalized]) return legacyMap[normalized];

  // Unknown role → fail safe: downgrade to CITIZEN, never escalate
  console.warn(`[auth/roles] Unknown backend role "${raw}" — defaulting to CITIZEN`);
  return Role.CITIZEN;
}

// ─── Display Labels ───────────────────────────────────────────

export const ROLE_LABEL: Record<Role, { vi: string; en: string }> = {
  [Role.CITIZEN]:     { vi: "Người dân",           en: "Citizen" },
  [Role.WARD_STAFF]:  { vi: "Cán bộ phường",        en: "Ward officer" },
  [Role.POLICE]:      { vi: "Công an / CSGT",        en: "Police officer" },
  [Role.SUPER_ADMIN]: { vi: "Lãnh đạo thành phố",   en: "City leadership" },
};
