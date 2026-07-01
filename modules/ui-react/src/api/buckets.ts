import { apiClient } from "@/api/client";
import { toApiAllocationPercent } from "@/lib/experiment-utils";
import type { Bucket } from "@/types";

function toApiBucketPayload(bucket: Partial<Bucket>) {
  const payload: Record<string, unknown> = {};
  if (bucket.label) {
    payload.label = bucket.label;
  }
  const allocation = bucket.allocationPercent ?? bucket.allocation;
  if (allocation != null) {
    payload.allocationPercent = toApiAllocationPercent(allocation);
  }
  if (bucket.description != null) {
    payload.description = bucket.description;
  }
  if (bucket.isControl != null || bucket.control != null) {
    payload.isControl = bucket.isControl ?? bucket.control;
  }
  if (bucket.payload != null) {
    payload.payload = bucket.payload;
  }
  return payload;
}

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
  await apiClient.post(
    `/api/v1/experiments/${experimentId}/buckets`,
    toApiBucketPayload(bucket)
  );
}

export async function updateBucket(
  experimentId: string,
  label: string,
  bucket: Partial<Bucket>
): Promise<void> {
  await apiClient.put(
    `/api/v1/experiments/${experimentId}/buckets/${encodeURIComponent(label)}`,
    toApiBucketPayload(bucket)
  );
}

export async function updateBuckets(
  experimentId: string,
  buckets: Partial<Bucket>[]
): Promise<void> {
  await apiClient.put(`/api/v1/experiments/${experimentId}/buckets`, {
    buckets: buckets.map((bucket) => ({
      label: bucket.label,
      allocationPercent: toApiAllocationPercent(
        bucket.allocationPercent ?? bucket.allocation ?? 0
      ),
    })),
  });
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
