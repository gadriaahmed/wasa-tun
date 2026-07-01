import { apiClient } from "@/api/client";
import { getTimezoneParam } from "@/lib/timezone";
import type { Application, PageInfo } from "@/types";

export async function fetchApplications(): Promise<Application[]> {
  const res = await apiClient.get<string[] | Application[]>(
    "/api/v1/applications"
  );
  const data = res.data;
  if (Array.isArray(data) && typeof data[0] === "string") {
    return (data as string[]).map((name) => ({ applicationName: name }));
  }
  return data as Application[];
}

export async function fetchApplicationAdmins(appName: string) {
  const res = await apiClient.get<{ users: unknown[] }>(
    `/api/v1/applications/${encodeURIComponent(appName)}/users`
  );
  return res.data.users ?? [];
}

export async function fetchApplicationPages(
  appName: string
): Promise<PageInfo[]> {
  const res = await apiClient.get<{ pages: PageInfo[] }>(
    `/api/v1/applications/${encodeURIComponent(appName)}/pages`
  );
  return res.data.pages ?? [];
}

export async function fetchApplicationExperiments(appName: string) {
  const res = await apiClient.get<unknown[]>(
    `/api/v1/applications/${encodeURIComponent(appName)}/experiments`
  );
  return res.data;
}

export async function fetchPageExperiments(appName: string, pageName: string) {
  const res = await apiClient.get<{ experiments: unknown[] }>(
    `/api/v1/applications/${encodeURIComponent(appName)}/pages/${encodeURIComponent(pageName)}/experiments`
  );
  return res.data.experiments ?? [];
}

export async function testSegmentationRule(
  appName: string,
  expLabel: string,
  profile: Record<string, unknown>
) {
  const res = await apiClient.post(
    `/api/v1/assignments/applications/${encodeURIComponent(appName)}/experiments/${encodeURIComponent(expLabel)}/ruletest`,
    { profile }
  );
  return res.data;
}

export async function fetchPriorities(appName: string) {
  const res = await apiClient.get<{ prioritizedExperiments: unknown[] }>(
    `/api/v1/applications/${encodeURIComponent(appName)}/priorities`
  );
  return res.data.prioritizedExperiments ?? [];
}

export async function updatePriorities(
  appName: string,
  experimentIDs: string[]
): Promise<void> {
  await apiClient.put(
    `/api/v1/applications/${encodeURIComponent(appName)}/priorities`,
    { experimentIDs }
  );
}

export async function fetchLogs(
  appName: string,
  page = 1,
  filter = "",
  sort = ""
) {
  const timezone = getTimezoneParam();
  const res = await apiClient.get(
    `/api/v1/logs/applications/${encodeURIComponent(appName)}?page=${page}&per_page=10&filter=${encodeURIComponent(filter)}&sort=${encodeURIComponent(sort)}&timezone=${timezone}`
  );
  return res.data;
}
