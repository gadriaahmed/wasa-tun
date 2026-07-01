export const USER_ROLES = {
  admin: "admin",
  user: "user",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const PERMISSIONS = {
  createPerm: "CREATE",
  readPerm: "READ",
  updatePerm: "UPDATE",
  deletePerm: "DELETE",
  adminPerm: "ADMIN",
  superadminPerm: "SUPERADMIN",
} as const;

export const LOGIN_TIMEOUT_WARNING_MS = 55 * 60 * 1000;
export const LOGIN_TIMEOUT_MS = 60 * 60 * 1000;

export const AUTH_STORAGE_KEYS = {
  accessToken: "access_token",
  tokenType: "token_type",
  email: "auth_email",
  permissions: "auth_permissions",
  isSuperadmin: "auth_is_superadmin",
  userRole: "auth_user_role",
  lastActivity: "auth_last_activity",
} as const;

export const AUTHN_TYPE = (import.meta.env.VITE_AUTHN_TYPE ?? "basic") as
  | "basic"
  | "sso";
