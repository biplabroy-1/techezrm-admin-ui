/**
 * Which nav sections each role may see.
 *
 * This mirrors server/src/utils/permissions.ts. The two have to agree: the menu
 * hiding something the API still allows is cosmetic, because anyone can type the
 * URL, and showing something the API blocks is worse - it invites a 403.
 *
 * The tiers:
 *   ADMIN   - everything, including user management.
 *   MANAGER - runs the business: purchase orders, refunds, destructive deletes.
 *   STAFF   - records and moves things: create, edit, read, stock transfers.
 *
 * Deliberately not restricted: reading listings, creating and updating records,
 * stock transfers, orders, messages. A warehouse cannot be worked by someone who
 * cannot add a product or move stock, and restricting reads tends to produce people
 * keeping their own spreadsheet instead.
 *
 * Each entry names the permission it depends on, so there is one thing to change
 * when a policy changes rather than a list of paths to keep in step.
 */

export type Role = "ADMIN" | "MANAGER" | "STAFF";

export const PERMISSIONS = {
  /** Managing user accounts and changing roles. */
  MANAGE_USERS: "manage_users",
  /** Money leaving the business: refunds and purchase orders. */
  COMMIT_SPEND: "commit_spend",
  /** Irreversible deletes of products, categories and stock. */
  DELETE_RECORDS: "delete_records",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL: Role[] = ["ADMIN", "MANAGER", "STAFF"];
const MANAGERS: Role[] = ["ADMIN", "MANAGER"];

export const ROLE_PERMISSIONS: Record<Permission, Role[]> = {
  [PERMISSIONS.MANAGE_USERS]: ["ADMIN"],
  [PERMISSIONS.COMMIT_SPEND]: MANAGERS,
  [PERMISSIONS.DELETE_RECORDS]: MANAGERS,
};

/** Roles allowed a permission. Used to filter by showing, not hiding. */
export function rolesWith(permission: Permission): Role[] {
  return ROLE_PERMISSIONS[permission];
}

/**
 * Nav entries that require a permission, keyed by path.
 *
 * Paths rather than labels, because labels get renamed ("Pending/Completed
 * Payment" became "Payments") and a stale label would silently stop matching.
 */
export const NAV_PERMISSIONS: Array<{ path: string; permission: Permission }> = [
  { path: "/admin/data-management/employees", permission: PERMISSIONS.MANAGE_USERS },
  { path: "/admin/payments/refund", permission: PERMISSIONS.COMMIT_SPEND },
  { path: "/admin/logistics/orders", permission: PERMISSIONS.COMMIT_SPEND },
  { path: "/admin/inventory/delete", permission: PERMISSIONS.DELETE_RECORDS },
  { path: "/admin/logistics/warehouse/delete-product", permission: PERMISSIONS.DELETE_RECORDS },
];

/** True when `role` may see the nav entry at `path`. Unknown roles see the basics. */
export function canSeePath(role: string | undefined | null, path: string): boolean {
  const rule = NAV_PERMISSIONS.find((r) => r.path === path);
  if (!rule) return true;
  if (!role) return false;
  return rolesWith(rule.permission).includes(role as Role);
}

/** True when `role` holds `permission` directly, for use outside the nav. */
export function roleHas(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return rolesWith(permission).includes(role as Role);
}

/** Every role that can see at least one entry, for docs and tests. */
export const ALL_ROLES: Role[] = ALL;
/**
 * The logged-in role, from the auth store or - failing that - from the JWT.
 *
 * The store is the normal source, but it only gained `role` recently: sessions
 * created before that fix hold `user: undefined`, and a guard that trusted the
 * store alone would have locked those users out of pages they are entitled to.
 * The token carries the role from sign-in, so it is a reliable fallback and nobody
 * has to log out and back in to pick this up.
 *
 * The token's role is a snapshot, so it may be stale after a role change. That is
 * acceptable for deciding what to SHOW - the API is the real authority and
 * re-checks every call against the live role - which is why it is a fallback rather
 * than the primary source.
 */
export function roleFromToken(token: string | null | undefined): string | undefined {
  if (!token) return undefined;
  const parts = token.split(".");
  if (parts.length < 2) return undefined;
  try {
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    payload += "=".repeat((4 - (payload.length % 4)) % 4);
    const binary =
      typeof atob === "function"
        ? atob(payload)
        : Buffer.from(payload, "base64").toString("binary");
    const json = decodeURIComponent(
      binary
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    const claims = JSON.parse(json);
    return typeof claims?.role === "string" ? claims.role : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolve the role to authorise with: the store first, then the token.
 *
 * Returns undefined only when neither source knows, and callers MUST treat that as
 * "no permissions" rather than "assume access" - a guard that fails open is not a
 * guard.
 */
export function resolveRole(
  storeRole: string | undefined | null,
  token?: string | null
): string | undefined {
  return storeRole || roleFromToken(token) || undefined;
}
