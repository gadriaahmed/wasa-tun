import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  closeBucket,
  createBucket,
  deleteBucket,
  emptyBucket,
  fetchBuckets,
  updateBuckets,
} from "@/api/buckets";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bucketAllocationPercent } from "@/lib/experiment-utils";
import type { Bucket } from "@/types";

interface BucketsTabProps {
  experimentId: string;
  readOnly?: boolean;
}

export function BucketsTab({ experimentId, readOnly = false }: BucketsTabProps) {
  const queryClient = useQueryClient();
  const [newLabel, setNewLabel] = useState("");
  const [newAllocation, setNewAllocation] = useState(50);

  const { data: buckets = [], isLoading } = useQuery({
    queryKey: ["buckets", experimentId],
    queryFn: () => fetchBuckets(experimentId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["buckets", experimentId] });

  const createMutation = useMutation({
    mutationFn: () =>
      createBucket(experimentId, {
        label: newLabel,
        allocationPercent: newAllocation,
        isControl: buckets.length === 0,
      }),
    onSuccess: () => {
      toast.success("Bucket created");
      setNewLabel("");
      void invalidate();
    },
    onError: () => toast.error("Failed to create bucket"),
  });

  const balanceMutation = useMutation({
    mutationFn: () => {
      const count = buckets.length;
      const perBucket = Math.floor((100 / count) * 100) / 100;
      let remaining = 100;
      const updated = buckets.map((b, i) => {
        const allocation =
          i === count - 1 ? remaining : perBucket;
        remaining -= allocation;
        return { ...b, allocationPercent: allocation };
      });
      return updateBuckets(experimentId, updated);
    },
    onSuccess: () => {
      toast.success("Buckets balanced");
      void invalidate();
    },
  });

  const bucketAction = useMutation({
    mutationFn: ({
      action,
      label,
    }: {
      action: "close" | "empty" | "delete";
      label: string;
    }) => {
      if (action === "close") return closeBucket(experimentId, label);
      if (action === "empty") return emptyBucket(experimentId, label);
      return deleteBucket(experimentId, label);
    },
    onSuccess: () => {
      toast.success("Bucket updated");
      void invalidate();
    },
    onError: () => toast.error("Bucket action failed"),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading buckets...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Buckets</CardTitle>
            <CardDescription>
              Manage allocation and control group for this experiment.
            </CardDescription>
          </div>
          {!readOnly && buckets.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => balanceMutation.mutate()}
            >
              Balance allocation
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Allocation %</TableHead>
                <TableHead>Control</TableHead>
                <TableHead>State</TableHead>
                {!readOnly && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {buckets.map((bucket: Bucket) => (
                <TableRow key={bucket.label}>
                  <TableCell>{bucket.label}</TableCell>
                  <TableCell>
                    {bucketAllocationPercent(bucket)}
                  </TableCell>
                  <TableCell>
                    {bucket.isControl || bucket.control ? "Yes" : "No"}
                  </TableCell>
                  <TableCell>{bucket.state ?? "ACTIVE"}</TableCell>
                  {!readOnly && (
                    <TableCell className="space-x-1 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          bucketAction.mutate({
                            action: "close",
                            label: bucket.label,
                          })
                        }
                      >
                        Close
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          bucketAction.mutate({
                            action: "empty",
                            label: bucket.label,
                          })
                        }
                      >
                        Empty
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          bucketAction.mutate({
                            action: "delete",
                            label: bucket.label,
                          })
                        }
                      >
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle>Add bucket</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="bucket-label">Label</Label>
              <Input
                id="bucket-label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bucket-allocation">Allocation %</Label>
              <Input
                id="bucket-allocation"
                type="number"
                min={0}
                max={100}
                value={newAllocation}
                onChange={(e) => setNewAllocation(Number(e.target.value))}
              />
            </div>
            <Button
              disabled={!newLabel.trim() || createMutation.isPending}
              onClick={() => {
                if (!/^[A-Za-z_$-][A-Za-z0-9_$-]*$/.test(newLabel.trim())) {
                  toast.error("Bucket name must start with a letter, _, $, or hyphen and contain no spaces");
                  return;
                }
                createMutation.mutate();
              }}
            >
              Add bucket
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
