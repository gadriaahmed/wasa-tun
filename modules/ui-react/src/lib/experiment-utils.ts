import type { Experiment, ExperimentStatus } from "@/types";

export function experimentName(exp: Experiment): string {
  return exp.label ?? exp.name ?? exp.id;
}

export function normalizeStatus(state?: string): ExperimentStatus {
  const upper = (state ?? "DRAFT").toUpperCase();
  if (
    upper === "RUNNING" ||
    upper === "DRAFT" ||
    upper === "PAUSED" ||
    upper === "TERMINATED"
  ) {
    return upper;
  }
  if (upper === "STOPPED") {
    return "PAUSED";
  }
  return "DRAFT";
}

export function stateActionLabel(state: ExperimentStatus): string {
  switch (state) {
    case "RUNNING":
      return "start";
    case "PAUSED":
      return "stop";
    case "TERMINATED":
      return "terminate";
    default:
      return "change";
  }
}

/** Backend stores sampling/allocation as a fraction (0.01–1.0); UI shows percent (1–100). */
export function percentToSamplingRate(percent: number): number {
  return parseFloat((percent / 100).toFixed(8));
}

export function samplingRateToPercent(rate?: number): number {
  if (rate == null || Number.isNaN(rate)) {
    return 0;
  }
  if (rate <= 1) {
    return parseFloat((rate * 100).toFixed(8));
  }
  return rate;
}

export function bucketAllocationPercent(bucket: {
  allocationPercent?: number;
  allocation?: number;
}): number {
  return samplingRateToPercent(
    bucket.allocationPercent ?? bucket.allocation
  );
}

export function toApiAllocationPercent(percent: number): number {
  if (percent <= 1) {
    return percent;
  }
  return percentToSamplingRate(percent);
}

/** Format dates the way the Wasabi API expects (legacy moment `YYYY-MM-DDTHH:mm:ssZZ`). */
export function formatExperimentDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}${offsetMins}`;
}

export function defaultExperimentStartTime(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

export function defaultExperimentEndTime(
  start = defaultExperimentStartTime()
): Date {
  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  return end;
}

export interface NewExperimentPayload {
  label: string;
  applicationName: string;
  description: string;
  samplingPercent: number;
  startTime: string;
  endTime: string;
  isRapidExperiment?: boolean;
  userCap?: number;
  tags?: string[];
}

export function buildNewExperimentPayload(input: {
  label: string;
  applicationName: string;
  description: string;
  samplingPercent: number;
  startTime?: Date;
  endTime?: Date;
  isRapidExperiment?: boolean;
  userCap?: number;
  tags?: string[];
}): NewExperimentPayload {
  const start = input.startTime ?? defaultExperimentStartTime();
  const end = input.endTime ?? defaultExperimentEndTime(start);
  const payload: NewExperimentPayload = {
    label: input.label.trim(),
    applicationName: input.applicationName.trim(),
    description: input.description.trim(),
    samplingPercent: percentToSamplingRate(input.samplingPercent),
    startTime: formatExperimentDateTime(start),
    endTime: formatExperimentDateTime(end),
  };

  if (input.isRapidExperiment) {
    payload.isRapidExperiment = true;
    if (input.userCap != null) {
      payload.userCap = input.userCap;
    }
  }
  if (input.tags?.length) {
    payload.tags = input.tags;
  }

  return payload;
}
