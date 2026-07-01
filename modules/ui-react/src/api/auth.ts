import { apiClient, buildAuthorizationHeader } from "@/api/client";
import { AUTHN_TYPE } from "@/lib/constants";
import type { AuthLoginResponse, PermissionsResponse } from "@/types";

export async function pingWithBasicAuth(
  username: string,
  password: string
): Promise<void> {
  const basic = btoa(`${username}:${password}`);
  await apiClient.get("/api/v1/ping", {
    headers: { Authorization: `Basic ${basic}` },
  });
}

export async function login(
  username: string,
  password: string
): Promise<AuthLoginResponse> {
  const basic = btoa(`${username}:${password}`);
  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const res = await apiClient.post<AuthLoginResponse>(
    "/api/v1/authentication/login",
    body.toString(),
    {
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return res.data;
}

export async function verifyToken(): Promise<void> {
  await apiClient.get("/api/v1/authentication/verifyToken");
}

export async function logout(): Promise<void> {
  try {
    await apiClient.get("/api/v1/authentication/logout");
  } catch {
    // ignore logout errors
  }
}

export async function getPermissions(
  userId: string,
  tokenType?: string,
  accessToken?: string
): Promise<PermissionsResponse> {
  const headers =
    tokenType && accessToken
      ? { Authorization: buildAuthorizationHeader(tokenType, accessToken) }
      : undefined;
  const res = await apiClient.get<PermissionsResponse>(
    `/api/v1/authorization/users/${encodeURIComponent(userId)}/permissions`,
    headers ? { headers } : undefined
  );
  return res.data;
}

export async function getUserRoles(userId: string) {
  const res = await apiClient.get<{ roleList: unknown[] }>(
    `/api/v1/authorization/users/${encodeURIComponent(userId)}/roles`
  );
  return res.data.roleList ?? [];
}

export async function assignRole(payload: {
  roleList: Array<{ applicationName: string; role: string; userID: string }>;
}): Promise<void> {
  await apiClient.post("/api/v1/authorization/roles", payload);
}

export async function getUsersForApplication(appName: string) {
  const res = await apiClient.get<{ roleList: unknown[] }>(
    `/api/v1/authorization/applications/${encodeURIComponent(appName)}`
  );
  return res.data.roleList ?? [];
}

export async function getUsersRoles() {
  const res = await apiClient.get<unknown[]>(
    "/api/v1/authorization/applications"
  );
  return res.data;
}

export async function deleteRoleForApplication(
  appName: string,
  userID: string
): Promise<void> {
  await apiClient.delete(
    `/api/v1/authorization/applications/${encodeURIComponent(appName)}/users/${encodeURIComponent(userID)}/roles`
  );
}

export async function getSuperadmins() {
  const res = await apiClient.get<unknown[]>(
    "/api/v1/authorization/superadmins"
  );
  return res.data;
}

export async function addSuperadmin(userID: string): Promise<void> {
  await apiClient.post(
    `/api/v1/authorization/superadmins/${encodeURIComponent(userID)}`
  );
}

export async function removeSuperadmin(userID: string): Promise<void> {
  await apiClient.delete(
    `/api/v1/authorization/superadmins/${encodeURIComponent(userID)}`
  );
}

export function getSsoRedirectUrl(): string | undefined {
  return import.meta.env.VITE_SSO_NO_AUTH_REDIRECT;
}

export function getSsoLogoutRedirect(): string | undefined {
  return import.meta.env.VITE_SSO_LOGOUT_REDIRECT;
}

export function isSsoEnabled(): boolean {
  return AUTHN_TYPE === "sso";
}
