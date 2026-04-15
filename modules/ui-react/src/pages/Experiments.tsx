import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

type ExperimentsResponse = Experiment[] | { experiments: Experiment[] };

const statusClasses: Record<ExperimentStatus, string> = {
  RUNNING: "bg-green-50 text-green-700 ring-1 ring-green-100",
  DRAFT: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  PAUSED: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  TERMINATED: "bg-red-50 text-red-700 ring-1 ring-red-100",
};

export function Experiments() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["experiments"],
    queryFn: async () => {
      const res = await apiClient.get<ExperimentsResponse>(
        "/api/v1/experiments"
      );
      const body = res.data;
      if (Array.isArray(body)) {
        return body;
      }
      return body.experiments ?? [];
    },
  });

  const experiments = data ?? [];
  const total = experiments.length;
  const running = experiments.filter((e) => e.status === "RUNNING").length;
  const drafts = experiments.filter((e) => e.status === "DRAFT").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-l-4 border-l-indigo-500 border-slate-200 bg-white shadow-sm">
          <CardHeader className="space-y-1">
            <CardDescription className="text-[13px] font-medium uppercase tracking-wide text-slate-500">
              Total
            </CardDescription>
            <CardTitle className="text-[28px] font-bold text-slate-900">
              {isLoading ? <Skeleton className="h-7 w-16" /> : total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-xl border-l-4 border-l-green-500 border-slate-200 bg-white shadow-sm">
          <CardHeader className="space-y-1">
            <CardDescription className="text-[13px] font-medium uppercase tracking-wide text-slate-500">
              Running
            </CardDescription>
            <CardTitle className="text-[28px] font-bold text-slate-900">
              {isLoading ? <Skeleton className="h-7 w-16" /> : running}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-xl border-l-4 border-l-slate-400 border-slate-200 bg-white shadow-sm">
          <CardHeader className="space-y-1">
            <CardDescription className="text-[13px] font-medium uppercase tracking-wide text-slate-500">
              Drafts
            </CardDescription>
            <CardTitle className="text-[28px] font-bold text-slate-900">
              {isLoading ? <Skeleton className="h-7 w-16" /> : drafts}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Experiments</CardTitle>
            <CardDescription>
              Manage and monitor your Wasabi experiments.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
          ) : isError ? (
            <p className="text-sm text-red-500">
              Failed to load experiments. Please try again.
            </p>
          ) : experiments.length === 0 ? (
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
              <Button className="mt-2 bg-indigo-600 text-white hover:bg-indigo-700">
                Create your first experiment
              </Button>
            </div>
          ) : (
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
                    <TableRow
                      key={exp.id}
                      className="hover:bg-slate-50/80"
                    >
                      <TableCell className="font-medium text-slate-900">
                        {exp.name}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {exp.applicationName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            statusClasses[exp.status]
                          )}
                        >
                          {exp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {exp.startTime
                          ? new Date(exp.startTime).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {exp.endTime
                          ? new Date(exp.endTime).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

