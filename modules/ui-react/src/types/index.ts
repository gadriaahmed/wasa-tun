export type ExperimentStatus = "DRAFT" | "RUNNING" | "PAUSED" | "TERMINATED";

export interface Bucket {
  label: string;
  allocationPercent?: number;
  allocation?: number;
  isControl?: boolean;
  control?: boolean;
  isEmpty?: boolean;
  empty?: boolean;
  description?: string;
  payload?: string;
  state?: string;
}

export interface Experiment {
  id: string;
  name?: string;
  label?: string;
  applicationName: string;
  description?: string;
  status?: ExperimentStatus;
  state?: string;
  startTime?: string;
  endTime?: string;
  start?: string;
  end?: string;
  createdTime?: string;
  modifiedTime?: string;
  samplingPercent?: number;
  isPersonalization?: boolean;
  rapidExperiment?: boolean;
  userCap?: number;
  rule?: string;
  tags?: string[];
  buckets?: Bucket[];
  creatorID?: string;
  favorite?: boolean;
}

export interface ExperimentsListResponse {
  experiments: Experiment[];
  totalEntries?: number;
  page?: number;
  perPage?: number;
}

export interface ApplicationPermission {
  applicationName: string;
  permissions: string[];
}

export interface PermissionsResponse {
  permissionsList: ApplicationPermission[];
}

export interface UserRoleEntry {
  applicationName: string;
  role: string;
  userID: string;
}

export interface AuthLoginResponse {
  access_token: string;
  token_type: string;
  error?: boolean;
}

export interface Application {
  applicationName: string;
}

export interface PageInfo {
  name: string;
  allowNewAssignment?: boolean;
}

export interface PrioritizedExperiment {
  id: string;
  label: string;
  applicationName: string;
  state: string;
  priority?: number;
}

export interface AuditLogEntry {
  id?: string;
  time?: string;
  user?: string;
  action?: string;
  message?: string;
  experimentLabel?: string;
  applicationName?: string;
}

export interface LogsResponse {
  logs: AuditLogEntry[];
  totalEntries?: number;
}

export interface FeedbackEntry {
  id?: string;
  username?: string;
  message?: string;
  created?: string;
  rating?: number;
}

export interface Superadmin {
  userID: string;
}

export interface ExperimentStatistics {
  buckets?: Record<
    string,
    {
      label: string;
      count?: number;
      improvement?: number;
      isControl?: boolean;
    }
  >;
  sortedBuckets?: Array<{ label: string; count?: number }>;
  jointActionCounts?: Record<string, number>;
}

export interface DailyStatistics {
  days?: Array<{
    date: string;
    buckets?: Record<string, { count?: number }>;
  }>;
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
  id?: string;
  userId?: string;
  userID?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}
