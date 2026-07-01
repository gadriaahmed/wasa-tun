import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createMutualExclusion,
  deleteMutualExclusion,
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
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MutualExclusionTabProps {
  experimentId: string;
  readOnly?: boolean;
}

export function MutualExclusionTab({
  experimentId,
  readOnly = false,
}: MutualExclusionTabProps) {
  const queryClient = useQueryClient();
  const [targetId, setTargetId] = useState("");

  const { data: exclusions = [], isLoading } = useQuery({
    queryKey: ["exclusions", experimentId],
    queryFn: () => fetchMutualExclusions(experimentId, true),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      createMutualExclusion(experimentId, {
        experimentId: targetId,
      }),
    onSuccess: () => {
      toast.success("Mutual exclusion added");
      setTargetId("");
      void queryClient.invalidateQueries({
        queryKey: ["exclusions", experimentId],
      });
    },
    onError: () => toast.error("Failed to add exclusion"),
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
    onError: () => toast.error("Failed to remove exclusion"),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mutually exclusive experiments</CardTitle>
        <CardDescription>
          Experiments that cannot run assignments concurrently with this one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {exclusions.map((exp) => {
            const item = exp as { id: string; label?: string };
            return (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span>{item.label ?? item.id}</span>
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
          );})}
          {exclusions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No mutual exclusions configured.
            </p>
          )}
        </ul>
        {!readOnly && (
          <div className="flex flex-wrap items-end gap-2">
            <Input
              placeholder="Target experiment ID"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="max-w-sm"
            />
            <Button
              disabled={!targetId.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              Add exclusion
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
