import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  changeExperimentState,
  deleteExperiment,
  fetchExperiment,
} from "@/api/experiments";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiCallsTab } from "@/components/experiments/ApiCallsTab";
import { BucketsTab } from "@/components/experiments/BucketsTab";
import { MutualExclusionTab } from "@/components/experiments/MutualExclusionTab";
import { PagesTab } from "@/components/experiments/PagesTab";
import { ResultsTab } from "@/components/experiments/ResultsTab";
import { SegmentationTab } from "@/components/experiments/SegmentationTab";
import {
  experimentName,
  normalizeStatus,
  stateActionLabel,
} from "@/lib/experiment-utils";
import type { ExperimentStatus } from "@/types";
import { useState } from "react";

export function ExperimentDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<{
    action: "delete" | ExperimentStatus;
    title: string;
    description: string;
  } | null>(null);

  const { data: experiment, isLoading, isError } = useQuery({
    queryKey: ["experiment", id],
    queryFn: () => fetchExperiment(id),
    enabled: !!id,
  });

  const stateMutation = useMutation({
    mutationFn: (state: ExperimentStatus) => changeExperimentState(id, state),
    onSuccess: () => {
      toast.success("Experiment state updated");
      void queryClient.invalidateQueries({ queryKey: ["experiment", id] });
      void queryClient.invalidateQueries({ queryKey: ["experiments"] });
      setConfirm(null);
    },
    onError: () => toast.error("Failed to change experiment state"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteExperiment(id),
    onSuccess: () => {
      toast.success("Experiment deleted");
      void queryClient.invalidateQueries({ queryKey: ["experiments"] });
      navigate("/experiments");
    },
    onError: () => toast.error("Failed to delete experiment"),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError || !experiment) {
    return (
      <p className="text-sm text-red-500">Failed to load experiment details.</p>
    );
  }

  const status = normalizeStatus(experiment.state ?? experiment.status);
  const readOnly = status === "TERMINATED";

  const requestStateChange = (state: ExperimentStatus) => {
    const action = stateActionLabel(state);
    setConfirm({
      action: state,
      title:
        state === "TERMINATED"
          ? "Permanently Terminate Experiment"
          : "Confirm State Change",
      description:
        state === "TERMINATED"
          ? `Are you sure you want to PERMANENTLY TERMINATE ${experimentName(experiment)}?`
          : `Are you sure you want to ${action} ${experimentName(experiment)}?`,
    });
  };

  const handleConfirm = () => {
    if (!confirm) {
      return;
    }
    if (confirm.action === "delete") {
      deleteMutation.mutate();
      return;
    }
    stateMutation.mutate(confirm.action);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-900">
              {experimentName(experiment)}
            </h2>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {experiment.applicationName}
            {experiment.description ? ` — ${experiment.description}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "DRAFT" && (
            <Button onClick={() => requestStateChange("RUNNING")}>Start</Button>
          )}
          {status === "RUNNING" && (
            <Button
              variant="outline"
              onClick={() => requestStateChange("PAUSED")}
            >
              Stop
            </Button>
          )}
          {status === "PAUSED" && (
            <Button onClick={() => requestStateChange("RUNNING")}>
              Resume
            </Button>
          )}
          {status !== "TERMINATED" && (
            <Button
              variant="destructive"
              onClick={() => requestStateChange("TERMINATED")}
            >
              Terminate
            </Button>
          )}
          {status === "DRAFT" && (
            <Button
              variant="outline"
              onClick={() =>
                setConfirm({
                  action: "delete",
                  title: "Delete Experiment",
                  description: `Delete experiment ${experiment.applicationName}, ${experimentName(experiment)}?`,
                })
              }
            >
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate("/experiments")}>
            Back
          </Button>
        </div>
      </div>

      <Tabs defaultValue="buckets">
        <TabsList>
          <TabsTrigger value="buckets">Buckets</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
          <TabsTrigger value="exclusions">Mutual Exclusion</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="api">API Calls</TabsTrigger>
        </TabsList>
        <TabsContent value="buckets">
          <BucketsTab experimentId={id} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="results">
          <ResultsTab experimentId={id} />
        </TabsContent>
        <TabsContent value="segmentation">
          <SegmentationTab
            experiment={experiment}
            readOnly={readOnly}
            onUpdated={() =>
              queryClient.invalidateQueries({ queryKey: ["experiment", id] })
            }
          />
        </TabsContent>
        <TabsContent value="exclusions">
          <MutualExclusionTab experimentId={id} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="pages">
          <PagesTab experimentId={id} readOnly={readOnly} />
        </TabsContent>
        <TabsContent value="api">
          <ApiCallsTab experiment={experiment} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        destructive={
          confirm?.action === "TERMINATED" || confirm?.action === "delete"
        }
        onConfirm={handleConfirm}
        loading={stateMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
