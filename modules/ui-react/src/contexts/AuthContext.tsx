import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAuthStorage,
  resetSessionTimers,
  setAuthTokens,
  setSessionHandlers,
} from "@/api/client";
import {
  getPermissions,
  isSsoEnabled,
  login,
  logout,
  verifyToken,
} from "@/api/auth";
import {
  AUTH_STORAGE_KEYS,
  PERMISSIONS,
  USER_ROLES,
  type UserRole,
} from "@/lib/constants";
import type { ApplicationPermission } from "@/types";
import { toast } from "sonner";

interface AuthState {
  email: string | null;
  accessToken: string | null;
  tokenType: string | null;
  permissions: ApplicationPermission[];
  userRole: UserRole;
  isSuperadmin: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  hasPermission: (appName: string, permission: string) => boolean;
  hasAdminForAnyApp: () => boolean;
  extendSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredPermissions(): ApplicationPermission[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEYS.permissions);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as ApplicationPermission[];
  } catch {
    return [];
  }
}

function hasAdminPermissions(
  permissions: ApplicationPermission[]
): boolean {
  return permissions.some((entry) =>
    entry.permissions?.includes(PERMISSIONS.adminPerm)
  );
}

function deriveUserRole(
  permissions: ApplicationPermission[],
  isSuperadmin: boolean
): UserRole {
  if (
    isSuperadmin ||
    hasAdminPermissions(permissions) ||
    permissions.some((p) =>
      p.permissions?.includes(PERMISSIONS.superadminPerm)
    )
  ) {
    return USER_ROLES.admin;
  }
  return USER_ROLES.user;
}

function persistSession(
  email: string,
  accessToken: string,
  tokenType: string,
  permissions: ApplicationPermission[],
  isSuperadmin: boolean,
  userRole: UserRole
) {
  window.localStorage.setItem(AUTH_STORAGE_KEYS.email, email);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.tokenType, tokenType);
  window.localStorage.setItem(
    AUTH_STORAGE_KEYS.permissions,
    JSON.stringify(permissions)
  );
  window.localStorage.setItem(
    AUTH_STORAGE_KEYS.isSuperadmin,
    String(isSuperadmin)
  );
  window.localStorage.setItem(AUTH_STORAGE_KEYS.userRole, userRole);
  resetSessionTimers();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    if (typeof window === "undefined") {
      return {
        email: null,
        accessToken: null,
        tokenType: null,
        permissions: [],
        userRole: USER_ROLES.user,
        isSuperadmin: false,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: true,
      };
    }
    const email = window.localStorage.getItem(AUTH_STORAGE_KEYS.email);
    const accessToken = window.localStorage.getItem(
      AUTH_STORAGE_KEYS.accessToken
    );
    const tokenType = window.localStorage.getItem(AUTH_STORAGE_KEYS.tokenType);
    const permissions = readStoredPermissions();
    const isSuperadmin =
      window.localStorage.getItem(AUTH_STORAGE_KEYS.isSuperadmin) === "true";
    const userRole =
      (window.localStorage.getItem(AUTH_STORAGE_KEYS.userRole) as UserRole) ??
      USER_ROLES.user;
    const isAuthenticated = !!(accessToken && tokenType && email);
    return {
      email,
      accessToken,
      tokenType,
      permissions,
      userRole,
      isSuperadmin,
      isAuthenticated,
      isAdmin: userRole === USER_ROLES.admin,
      isLoading: false,
    };
  });

  const signOut = useCallback(async () => {
    await logout();
    clearAuthStorage();
    setState({
      email: null,
      accessToken: null,
      tokenType: null,
      permissions: [],
      userRole: USER_ROLES.user,
      isSuperadmin: false,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    });
  }, []);

  const extendSession = useCallback(async () => {
    await verifyToken();
    resetSessionTimers();
    toast.success("Session extended");
  }, []);

  useEffect(() => {
    setSessionHandlers({
      onExpired: () => {
        toast.error("Your session has expired. Please sign in again.");
        void signOut();
      },
      onWarning: () => {
        toast("Your login is about to expire.", {
          description: "Continue working to stay signed in.",
          action: {
            label: "Continue",
            onClick: () => void extendSession(),
          },
        });
      },
    });
    if (state.isAuthenticated) {
      resetSessionTimers();
    }
  }, [extendSession, signOut, state.isAuthenticated]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await login(email, password);
    if (result.error) {
      throw new Error("Invalid credentials");
    }

    // Token must be stored before getPermissions — the axios interceptor reads localStorage
    setAuthTokens(email, result.access_token, result.token_type);

    const permissionsResult = await getPermissions(
      email,
      result.token_type,
      result.access_token
    );
    const permissions = permissionsResult.permissionsList ?? [];
    const isSuperadmin =
      permissions.length > 0 &&
      permissions[0].permissions?.includes(PERMISSIONS.superadminPerm);
    const userRole = deriveUserRole(permissions, !!isSuperadmin);

    persistSession(
      email,
      result.access_token,
      result.token_type,
      permissions,
      !!isSuperadmin,
      userRole
    );

    setState({
      email,
      accessToken: result.access_token,
      tokenType: result.token_type,
      permissions,
      userRole,
      isSuperadmin: !!isSuperadmin,
      isAuthenticated: true,
      isAdmin: userRole === USER_ROLES.admin,
      isLoading: false,
    });
  }, []);

  const refreshPermissions = useCallback(async () => {
    if (!state.email) {
      return;
    }
    const permissionsResult = await getPermissions(state.email);
    const permissions = permissionsResult.permissionsList ?? [];
    const isSuperadmin =
      permissions.length > 0 &&
      permissions[0].permissions?.includes(PERMISSIONS.superadminPerm);
    const userRole = deriveUserRole(permissions, !!isSuperadmin);
    window.localStorage.setItem(
      AUTH_STORAGE_KEYS.permissions,
      JSON.stringify(permissions)
    );
    window.localStorage.setItem(
      AUTH_STORAGE_KEYS.isSuperadmin,
      String(!!isSuperadmin)
    );
    window.localStorage.setItem(AUTH_STORAGE_KEYS.userRole, userRole);
    setState((prev) => ({
      ...prev,
      permissions,
      isSuperadmin: !!isSuperadmin,
      userRole,
      isAdmin: userRole === USER_ROLES.admin,
    }));
  }, [state.email]);

  const hasPermission = useCallback(
    (appName: string, permission: string) => {
      if (state.isSuperadmin) {
        return true;
      }
      const entry = state.permissions.find(
        (p) => p.applicationName === appName
      );
      return entry?.permissions?.includes(permission) ?? false;
    },
    [state.isSuperadmin, state.permissions]
  );

  const hasAdminForAnyApp = useCallback(() => state.isAdmin, [state.isAdmin]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signOut,
      refreshPermissions,
      hasPermission,
      hasAdminForAnyApp,
      extendSession,
    }),
    [
      state,
      signIn,
      signOut,
      refreshPermissions,
      hasPermission,
      hasAdminForAnyApp,
      extendSession,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}

export { isSsoEnabled };
