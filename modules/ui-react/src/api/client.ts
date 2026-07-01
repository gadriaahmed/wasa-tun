import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  AUTH_STORAGE_KEYS,
  LEGACY_TOKEN_KEY,
  LOGIN_TIMEOUT_MS,
  LOGIN_TIMEOUT_WARNING_MS,
} from "@/lib/constants";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "" : "http://localhost:8080");

export interface AuthRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  authHeader?: string;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let sessionWarningTimer: ReturnType<typeof setTimeout> | undefined;
let sessionLogoutTimer: ReturnType<typeof setTimeout> | undefined;
let onSessionExpired: (() => void) | undefined;
let onSessionWarning: (() => void) | undefined;

export function setSessionHandlers(handlers: {
  onExpired?: () => void;
  onWarning?: () => void;
}) {
  onSessionExpired = handlers.onExpired;
  onSessionWarning = handlers.onWarning;
}

function clearSessionTimers() {
  if (sessionWarningTimer) {
    clearTimeout(sessionWarningTimer);
    sessionWarningTimer = undefined;
  }
  if (sessionLogoutTimer) {
    clearTimeout(sessionLogoutTimer);
    sessionLogoutTimer = undefined;
  }
}

function resetSessionTimers() {
  if (typeof window === "undefined") {
    return;
  }
  const authorization = window.localStorage.getItem(
    AUTH_STORAGE_KEYS.authorization
  );
  if (!authorization) {
    return;
  }

  clearSessionTimers();
  window.localStorage.setItem(
    AUTH_STORAGE_KEYS.lastActivity,
    String(Date.now())
  );

  sessionWarningTimer = setTimeout(() => {
    onSessionWarning?.();
  }, LOGIN_TIMEOUT_WARNING_MS);

  sessionLogoutTimer = setTimeout(() => {
    onSessionExpired?.();
  }, LOGIN_TIMEOUT_MS);
}

export function clearAuthStorage() {
  if (typeof window === "undefined") {
    return;
  }
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => {
    window.localStorage.removeItem(key);
  });
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  clearSessionTimers();
}

export function buildAuthorizationHeader(
  tokenType: string,
  accessToken: string
): string {
  return `${tokenType} ${accessToken}`;
}

export function setAuthTokens(
  email: string,
  accessToken: string,
  tokenType: string
) {
  if (typeof window === "undefined") {
    return;
  }
  const authorization = buildAuthorizationHeader(tokenType, accessToken);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.email, email);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.tokenType, tokenType);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.authorization, authorization);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function getStoredAuthorization(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const cached = window.localStorage.getItem(AUTH_STORAGE_KEYS.authorization);
  if (cached) {
    return cached;
  }
  const tokenType = window.localStorage.getItem(AUTH_STORAGE_KEYS.tokenType);
  const accessToken = window.localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
  if (tokenType && accessToken) {
    return buildAuthorizationHeader(tokenType, accessToken);
  }
  return null;
}

function resolveAuthorization(config: AuthRequestConfig): string | undefined {
  if (config.authHeader) {
    return config.authHeader;
  }
  const fromHeaders = (
    config.headers as { Authorization?: string; get?: (k: string) => string }
  )?.Authorization;
  if (fromHeaders) {
    return fromHeaders;
  }
  return getStoredAuthorization() ?? undefined;
}

function setAuthHeader(
  config: AuthRequestConfig,
  authorization: string
) {
  const headers = config.headers as
    | { set?: (k: string, v: string) => void; Authorization?: string }
    | undefined;
  if (headers?.set) {
    headers.set("Authorization", authorization);
  } else if (headers) {
    headers.Authorization = authorization;
  } else {
    config.headers = { Authorization: authorization } as typeof config.headers;
  }
}

apiClient.interceptors.request.use(
  (config) => {
    const authConfig = config as AuthRequestConfig;
    const url = authConfig.url ?? "";

    if (authConfig.skipAuth || /\/authentication\/login/.test(url)) {
      return authConfig;
    }

    const authorization = resolveAuthorization(authConfig);

    if (authorization) {
      setAuthHeader(authConfig, authorization);
      if (!/\/logout$/.test(url)) {
        resetSessionTimers();
      }
    }

    return authConfig;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      const url = error?.config?.url ?? "";
      const isLoginRequest = /\/authentication\/login/.test(url);
      const onLoginPage = window.location.pathname.startsWith("/login");
      if (!isLoginRequest && !onLoginPage) {
        clearAuthStorage();
        onSessionExpired?.();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export { resetSessionTimers };
