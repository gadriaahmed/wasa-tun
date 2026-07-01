import { apiClient } from "@/api/client";
import { getTimezoneParam } from "@/lib/timezone";
import type {
  Experiment,
  ExperimentsListResponse,
  ExperimentStatus,
} from "@/types";

export interface ExperimentsQueryParams {
  page?: number;
  perPage?: number;
  filter?: string;
  sort?: string;
  prefix?: string;
}

export async function fetchExperiments(
  params: ExperimentsQueryParams = {}
): Promise<ExperimentsListResponse> {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 100;
  const filter = params.filter ?? "";
  const sort = params.sort ?? "";
  const timezone = getTimezoneParam();
  const res = await apiClient.get<ExperimentsListResponse>(
    `/api/v1/experiments?page=${page}&per_page=${perPage}&filter=${encodeURIComponent(filter)}&sort=${encodeURIComponent(sort)}&timezone=${timezone}`
  );
  return res.data;
}

export async function fetchExperiment(id: string): Promise<Experiment> {
  const res = await apiClient.get<Experiment>(`/api/v1/experiments/${id}`);
  return res.data;
}

export async function createExperiment(
  payload: Partial<Experiment>,
  createNewApplication = false
): Promise<Experiment> {
  const url = createNewApplication
    ? "/api/v1/experiments/?createNewApplication=true"
    : "/api/v1/experiments";
  const res = await apiClient.post<Experiment>(url, payload);
  return res.data;
}

export async function updateExperiment(
  id: string,
  payload: Partial<Experiment>,
  createNewApplication = false
): Promise<Experiment> {
  const url = createNewApplication
    ? `/api/v1/experiments/${id}/?createNewApplication=true`
    : `/api/v1/experiments/${id}`;
  const { id: _id, ...body } = payload as Experiment;
  const res = await apiClient.put<Experiment>(url, body);
  return res.data;
}

export async function deleteExperiment(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/experiments/${id}`);
}

export async function changeExperimentState(
  id: string,
  state: ExperimentStatus
): Promise<Experiment> {
  return updateExperiment(id, { state });
}

export async function fetchExperimentPages(id: string) {
  const res = await apiClient.get<{ pages: unknown[] }>(
    `/api/v1/experiments/${id}/pages`
  );
  return res.data.pages ?? [];
}

export async function saveExperimentPages(
  id: string,
  pages: unknown[]
): Promise<void> {
  await apiClient.post(`/api/v1/experiments/${id}/pages`, { pages });
}

export async function removeExperimentPage(
  id: string,
  pageName: string
): Promise<void> {
  await apiClient.delete(
    `/api/v1/experiments/${id}/pages/${encodeURIComponent(pageName)}`
  );
}

export async function fetchExperimentTraffic(
  id: string,
  start: string,
  end: string
) {
  const timezone = getTimezoneParam();
  const res = await apiClient.get(
    `/api/v1/experiments/${id}/assignments/traffic/${start}/${end}?per_page=-1&timezone=${timezone}`
  );
  return res.data;
}

export async function fetchMutualExclusions(
  experimentId: string,
  exclusiveFlag = false
) {
  const res = await apiClient.get<{ experiments: unknown[] }>(
    `/api/v1/experiments/${experimentId}/exclusions/?showAll=true&exclusive=${exclusiveFlag}`
  );
  return res.data.experiments ?? [];
}

export async function createMutualExclusion(
  experimentId: string,
  payload: unknown
): Promise<void> {
  await apiClient.post(
    `/api/v1/experiments/${experimentId}/exclusions`,
    payload
  );
}

export async function deleteMutualExclusion(
  experimentId1: string,
  experimentId2: string
): Promise<void> {
  await apiClient.delete(
    `/api/v1/experiments/exclusions/experiment1/${experimentId1}/experiment2/${experimentId2}`
  );
}

export async function fetchAllTags() {
  const res = await apiClient.get<Record<string, string[]>>(
    "/api/v1/applications/tags"
  );
  return res.data ?? {};
}

export async function fetchFavorites() {
  const res = await apiClient.get<{ favorites?: unknown[] }>(
    "/api/v1/favorites"
  );
  return res.data;
}

export async function addFavorite(experimentId: string): Promise<void> {
  await apiClient.post("/api/v1/favorites", { experimentId });
}

export async function removeFavorite(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/favorites/${id}`);
}
