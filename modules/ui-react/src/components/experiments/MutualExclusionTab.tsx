import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createMutualExclusion,
  deleteMutualExclusion,
  fetchExperiments,
  fetchMutualExclusions,
} from "@/api/experiments";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { experimentName } from "@/lib/experiment-utils";
import type { Experiment } from "@/types";

interface MutualExclusionTabProps {
  experimentId: string;
  applicationName: string;
  readOnly?: boolean;
}

function extractApiError(err: unknown): string {
  const message = (
    err as { response?: { data?: { error?: { message?: string } } } }
  )?.response?.data?.error?.message;
  return message ?? "Request failed";
}

export function MutualExclusionTab({
  experimentId,
  applicationName,
  readOnly = false,
}: MutualExclusionTabProps) {
  const queryClient = useQueryClient();
  const [targetId, setTargetId] = useState("");

  const { data: exclusions = [], isLoading } = useQuery({
    queryKey: ["exclusions", experimentId],
    queryFn: () => fetchMutualExclusions(experimentId, true),
  });

  const { data: appExperimentsData } = useQuery({
    queryKey: ["experiments", "app", applicationName],
    queryFn: async () => {
      const res = await fetchExperiments({ perPage: 500 });
      return {
        experiments: res.experiments.filter(
          (exp) => exp.applicationName === applicationName
        ),
      };
    },
    enabled: !!applicationName,
  });

  const candidateExperiments = useMemo(() => {
    const experiments = appExperimentsData?.experiments ?? [];
    const excludedIds = new Set(
      exclusions.map((exp) => (exp as Experiment).id).filter(Boolean)
    );
    return experiments.filter(
      (exp) =>
        exp.id !== experimentId &&
        !excludedIds.has(exp.id) &&
        exp.state !== "TERMINATED" &&
        exp.state !== "DELETED"
    );
  }, [appExperimentsData?.experiments, exclusions, experimentId]);

  const addMutation = useMutation({
    mutationFn: () => createMutualExclusion(experimentId, [targetId.trim()]),
    onSuccess: (data) => {
      const failed = data.exclusions?.filter((e) => e.status === "FAILED") ?? [];
      if (failed.length > 0) {
        toast.error(
          failed[0]?.reason ??
            "Could not create mutual exclusion — experiments must be in the same application and not expired."
        );
      } else {
        toast.success("Mutual exclusion added");
        setTargetId("");
      }
      void queryClient.invalidateQueries({
        queryKey: ["exclusions", experimentId],
      });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const removeMutation = useMutation({
    mutationFn: (otherId: string) =>
      deleteMutualExclusion(experimentId, otherId),
    onSuccess: () => {
      toast.success("Mutual exclusion removed");
      void queryClient.invalidateQueries({
        queryKey: ["exclusions", experimentId],
      });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mutually exclusive experiments</CardTitle>
        <CardDescription>
          Experiments in <strong>{applicationName}</strong> that cannot run
          assignments concurrently with this one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {exclusions.map((exp) => {
            const item = exp as Experiment;
            return (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>
                  {experimentName(item)}{" "}
                  <span className="text-muted-foreground">({item.id})</span>
                </span>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMutation.mutate(item.id)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            );
          })}
          {exclusions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No mutual exclusions configured.
            </p>
          )}
        </ul>
        {!readOnly && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="exclusion-target">Experiment in this app</Label>
              <Select
                id="exclusion-target"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="min-w-[280px]"
              >
                <option value="" disabled>
                  Select experiment
                </option>
                {candidateExperiments.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {experimentName(exp)} ({exp.state ?? "DRAFT"})
                  </option>
                ))}
              </Select>
            </div>
            <Button
              disabled={!targetId.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              Add exclusion
            </Button>
          </div>
        )}
        {!readOnly && candidateExperiments.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No other active experiments in this application are available to
            exclude.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
