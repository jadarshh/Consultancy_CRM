// ─── Role-Based Access Control ───────────────────────────────────────────────

export type UserRole = "ADMIN" | "MANAGER" | "COUNSELOR" | "RECEPTIONIST";

export type Permission =
  | "students:view_all"
  | "students:view_own"
  | "students:create"
  | "students:edit_any"
  | "students:edit_own"
  | "students:delete"
  | "students:assign_counselor"
  | "students:view_financial"
  | "pipeline:change_stage"
  | "applications:manage"
  | "documents:upload"
  | "documents:verify"
  | "communications:log"
  | "communications:view_all"
  | "tasks:create"
  | "tasks:view_all"
  | "countries:manage"
  | "universities:manage"
  | "reports:view_full"
  | "reports:view_own"
  | "data:export"
  | "users:manage"
  | "settings:manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "students:view_all",
    "students:create",
    "students:edit_any",
    "students:delete",
    "students:assign_counselor",
    "students:view_financial",
    "pipeline:change_stage",
    "applications:manage",
    "documents:upload",
    "documents:verify",
    "communications:log",
    "communications:view_all",
    "tasks:create",
    "tasks:view_all",
    "countries:manage",
    "universities:manage",
    "reports:view_full",
    "data:export",
    "users:manage",
    "settings:manage",
  ],
  MANAGER: [
    "students:view_all",
    "students:create",
    "students:edit_any",
    "students:assign_counselor",
    "students:view_financial",
    "pipeline:change_stage",
    "applications:manage",
    "documents:upload",
    "documents:verify",
    "communications:log",
    "communications:view_all",
    "tasks:create",
    "tasks:view_all",
    "countries:manage",
    "universities:manage",
    "reports:view_full",
    "data:export",
  ],
  COUNSELOR: [
    "students:view_own",
    "students:create",
    "students:edit_own",
    "students:view_financial",
    "pipeline:change_stage",
    "applications:manage",
    "documents:upload",
    "documents:verify",
    "communications:log",
    "tasks:create",
    "reports:view_own",
  ],
  RECEPTIONIST: [
    "students:view_all",
    "students:create",
    "documents:upload",
    "communications:log",
    "tasks:create",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  COUNSELOR: "Counselor",
  RECEPTIONIST: "Receptionist",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "badge-danger",
  MANAGER: "badge-primary",
  COUNSELOR: "badge-info",
  RECEPTIONIST: "badge-neutral",
};
