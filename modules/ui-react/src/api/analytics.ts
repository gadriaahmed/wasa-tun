import { apiClient } from "@/api/client";
import type { FeedbackEntry } from "@/types";

export async function sendFeedback(payload: {
  message: string;
  rating?: number;
  username?: string;
}): Promise<void> {
  await apiClient.post("/api/v1/feedback", payload);
}

export async function fetchFeedback(): Promise<FeedbackEntry[]> {
  const res = await apiClient.get<{ feedback: FeedbackEntry[] }>(
    "/api/v1/feedback"
  );
  return res.data.feedback ?? [];
}

export async function fetchExperimentStatistics(experimentId: string) {
  const res = await apiClient.get(
    `/api/v1/analytics/experiments/${experimentId}/statistics`
  );
  return res.data;
}

export async function fetchDailyStatistics(experimentId: string) {
  const res = await apiClient.get(
    `/api/v1/analytics/experiments/${experimentId}/statistics/dailies`
  );
  return res.data;
}

export async function fetchDailyStatisticsWithRange(
  experimentId: string,
  payload: { start?: string; end?: string }
) {
  const res = await apiClient.post(
    `/api/v1/analytics/experiments/${experimentId}/statistics/dailies`,
    payload
  );
  return res.data;
}

export async function fetchCardViewAnalytics(params: {
  page?: number;
  perPage?: number;
  filter?: string;
  sort?: string;
}) {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 100;
  const filter = params.filter ?? "";
  const sort = params.sort ?? "";
  const timezone = new Date().toString().match(/([-+][0-9]+)\s/)?.[1]?.replace("+", "%2B") ?? "+00";
  const res = await apiClient.get(
    `/api/v1/analytics/experiments?page=${page}&per_page=${perPage}&filter=${encodeURIComponent(filter)}&sort=${encodeURIComponent(sort)}&timezone=${timezone}`
  );
  return res.data;
}

export async function fetchAssignmentCounts(experimentId: string) {
  const res = await apiClient.get(
    `/api/v1/analytics/experiments/${experimentId}/assignments/counts`
  );
  return res.data;
}
