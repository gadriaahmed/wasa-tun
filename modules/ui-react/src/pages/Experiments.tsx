import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { FlaskConical, LayoutGrid, List } from "lucide-react";
import { useExperiments } from "@/hooks/useExperiments";
import { experimentName, normalizeStatus } from "@/lib/experiment-utils";
import type { Experiment, ExperimentStatus } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";

const STATUS_OPTIONS: Array<ExperimentStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "RUNNING",
  "PAUSED",
  "TERMINATED",
];

export function Experiments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | "ALL">(
    "ALL"
  );
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const { data, isLoading, isError, refetch } = useExperiments(search);

  const experiments = data?.experiments ?? [];

  const filtered = useMemo(() => {
    return experiments.filter((exp) => {
      const status = normalizeStatus(exp.state ?? exp.status);
      if (statusFilter !== "ALL" && status !== statusFilter) {
        return false;
      }
      if (!search.trim()) {
        return true;
      }
      const q = search.toLowerCase();
      return (
        experimentName(exp).toLowerCase().includes(q) ||
        exp.applicationName.toLowerCase().includes(q)
      );
    });
  }, [experiments, search, statusFilter]);

  const running = experiments.filter(
    (e) => normalizeStatus(e.state ?? e.status) === "RUNNING"
  ).length;
  const drafts = experiments.filter(
    (e) => normalizeStatus(e.state ?? e.status) === "DRAFT"
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total" value={experiments.length} loading={isLoading} accent="indigo" />
        <SummaryCard label="Running" value={running} loading={isLoading} accent="green" />
        <SummaryCard label="Drafts" value={drafts} loading={isLoading} accent="slate" />
      </div>

      <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Experiments</CardTitle>
            <CardDescription>
              Manage and monitor your Wasabi experiments.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
            <Button asChild size="sm">
              <Link to="/experiments/new">New Experiment</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Search by name or application..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:max-w-sm"
            />
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ExperimentStatus | "ALL")
              }
              className="md:w-40"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "ALL" ? "All statuses" : opt}
                </option>
              ))}
            </Select>
            <div className="flex gap-1 md:ml-auto">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon-sm"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
              >
                <List className="size-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="icon-sm"
                onClick={() => setViewMode("cards")}
                aria-label="Card view"
              >
                <LayoutGrid className="size-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <p className="text-sm text-red-500">
              Failed to load experiments. Please try again.
            </p>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : viewMode === "table" ? (
            <ExperimentsTable experiments={filtered} />
          ) : (
            <ExperimentsCards experiments={filtered} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  loading,
  accent,
}: {
  label: string;
  value: number;
  loading: boolean;
  accent: "indigo" | "green" | "slate";
}) {
  const border =
    accent === "indigo"
      ? "border-l-indigo-500"
      : accent === "green"
        ? "border-l-green-500"
        : "border-l-slate-400";
  return (
    <Card className={`rounded-xl border-l-4 ${border} border-slate-200 bg-white shadow-sm`}>
      <CardHeader className="space-y-1">
        <CardDescription className="text-[13px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </CardDescription>
        <CardTitle className="text-[28px] font-bold text-slate-900">
          {loading ? <Skeleton className="h-7 w-16" /> : value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function ExperimentsTable({ experiments }: { experiments: Experiment[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Name</TableHead>
            <TableHead>Application</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {experiments.map((exp) => (
            <TableRow key={exp.id} className="hover:bg-slate-50/80">
              <TableCell className="font-medium text-slate-900">
                {experimentName(exp)}
              </TableCell>
              <TableCell className="text-slate-600">
                {exp.applicationName}
              </TableCell>
              <TableCell>
                <StatusBadge status={exp.state ?? exp.status} />
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {formatDate(exp.startTime ?? exp.start)}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {formatDate(exp.endTime ?? exp.end)}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/experiments/${exp.id}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ExperimentsCards({ experiments }: { experiments: Experiment[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {experiments.map((exp) => (
        <Card key={exp.id} className="border-slate-200">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base">{experimentName(exp)}</CardTitle>
              <StatusBadge status={exp.state ?? exp.status} />
            </div>
            <CardDescription>{exp.applicationName}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/experiments/${exp.id}`}>Open</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <FlaskConical className="h-6 w-6" />
      </div>
      <div>
        <p className="text-base font-medium text-slate-900">
          No experiments yet
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Create your first experiment to start running A/B tests.
        </p>
      </div>
      <Button asChild className="mt-2">
        <Link to="/experiments/new">Create your first experiment</Link>
      </Button>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }
  try {
    return format(new Date(value), "MMM d, yyyy HH:mm");
  } catch {
    return value;
  }
}
