import { apiClient } from "@/api/client";
import type { Bucket } from "@/types";

export async function fetchBuckets(experimentId: string): Promise<Bucket[]> {
  const res = await apiClient.get<{ buckets: Bucket[] }>(
    `/api/v1/experiments/${experimentId}/buckets`
  );
  return res.data.buckets ?? [];
}

export async function createBucket(
  experimentId: string,
  bucket: Partial<Bucket>
): Promise<void> {
  await apiClient.post(`/api/v1/experiments/${experimentId}/buckets`, bucket);
}

export async function updateBucket(
  experimentId: string,
  label: string,
  bucket: Partial<Bucket>
): Promise<void> {
  await apiClient.put(
    `/api/v1/experiments/${experimentId}/buckets/${encodeURIComponent(label)}`,
    bucket
  );
}

export async function updateBuckets(
  experimentId: string,
  buckets: Partial<Bucket>[]
): Promise<void> {
  await apiClient.put(
    `/api/v1/experiments/${experimentId}/buckets`,
    { buckets }
  );
}

export async function deleteBucket(
  experimentId: string,
  label: string
): Promise<void> {
  await apiClient.delete(
    `/api/v1/experiments/${experimentId}/buckets/${encodeURIComponent(label)}`
  );
}

export async function closeBucket(
  experimentId: string,
  label: string
): Promise<void> {
  await apiClient.put(
    `/api/v1/experiments/${experimentId}/buckets/${encodeURIComponent(label)}/state/CLOSED`,
    {}
  );
}

export async function emptyBucket(
  experimentId: string,
  label: string
): Promise<void> {
  await apiClient.put(
    `/api/v1/experiments/${experimentId}/buckets/${encodeURIComponent(label)}/state/EMPTY`,
    {}
  );
}
