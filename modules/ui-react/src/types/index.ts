export type ExperimentStatus = "DRAFT" | "RUNNING" | "PAUSED" | "TERMINATED";

export interface Bucket {
  label: string;
  allocationPercent: number;
  isControl: boolean;
  isEmpty?: boolean;
  description?: string;
}

export interface Experiment {
  id: string;
  name: string;
  applicationName: string;
  description?: string;
  status: ExperimentStatus;
  startTime?: string; // ISO 8601
  endTime?: string; // ISO 8601
  createdTime?: string;
  modifiedTime?: string;
  buckets?: Bucket[];
}

export interface Assignment {
  experimentId: string;
  experimentName: string;
  applicationName: string;
  bucketLabel: string | null;
  status: ExperimentStatus | "NEW" | "EXISTING" | "NO_EXPERIMENT" | string;
  userId: string;
}

export interface User {
  id: string;
  userId: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

