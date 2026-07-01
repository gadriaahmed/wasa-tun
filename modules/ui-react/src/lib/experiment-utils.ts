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
