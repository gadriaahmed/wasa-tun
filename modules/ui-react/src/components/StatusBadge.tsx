import type { ExperimentStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { normalizeStatus } from "@/lib/experiment-utils";

const statusClasses: Record<ExperimentStatus, string> = {
  RUNNING: "bg-green-50 text-green-700 ring-1 ring-green-100",
  DRAFT: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  PAUSED: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  TERMINATED: "bg-red-50 text-red-700 ring-1 ring-red-100",
};

interface StatusBadgeProps {
  status?: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = normalizeStatus(status);
  return (
    <Badge
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusClasses[normalized],
        className
      )}
    >
      {normalized}
    </Badge>
  );
}
