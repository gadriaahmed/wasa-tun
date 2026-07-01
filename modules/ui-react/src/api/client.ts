import axios from "axios";
import {
  AUTH_STORAGE_KEYS,
  LOGIN_TIMEOUT_MS,
  LOGIN_TIMEOUT_WARNING_MS,
} from "@/lib/constants";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "" : "http://localhost:8080");

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
  const token = window.localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
  if (!token) {
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
  clearSessionTimers();
}

/** Persist bearer token so subsequent requests include Authorization. */
export function setAuthTokens(
  email: string,
  accessToken: string,
  tokenType: string
) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEYS.email, email);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.tokenType, tokenType);
}

export function buildAuthorizationHeader(
  tokenType: string,
  accessToken: string
): string {
  return `${tokenType} ${accessToken}`;
}

export function setAuthHeader(
  config: { headers?: unknown; url?: string },
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
    config.headers = { Authorization: authorization };
  }
}

apiClient.interceptors.request.use(
  (config) => {
    const url = config.url ?? "";
    const isLoginRequest = /\/authentication\/login/.test(url);

    if (typeof window !== "undefined" && !isLoginRequest) {
      const tokenType = window.localStorage.getItem(AUTH_STORAGE_KEYS.tokenType);
      const accessToken = window.localStorage.getItem(
        AUTH_STORAGE_KEYS.accessToken
      );
      if (tokenType && accessToken) {
        setAuthHeader(config, buildAuthorizationHeader(tokenType, accessToken));
        if (!/\/logout$/.test(url)) {
          resetSessionTimers();
        }
      }
    }
    return config;
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
