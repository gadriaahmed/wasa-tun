import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { testSegmentationRule } from "@/api/applications";
import { updateExperiment } from "@/api/experiments";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { experimentName } from "@/lib/experiment-utils";
import type { Experiment } from "@/types";

interface SegmentationTabProps {
  experiment: Experiment;
  readOnly?: boolean;
  onUpdated: () => void;
}

export function SegmentationTab({
  experiment,
  readOnly = false,
  onUpdated,
}: SegmentationTabProps) {
  const [rule, setRule] = useState(experiment.rule ?? "");
  const [testContext, setTestContext] = useState('{"country":"US"}');
  const [testResult, setTestResult] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateExperiment(experiment.id, {
        ...experiment,
        rule,
      }),
    onSuccess: () => {
      toast.success("Segmentation rule saved");
      onUpdated();
    },
    onError: () => toast.error("Failed to save rule"),
  });

  const testMutation = useMutation({
    mutationFn: () =>
      testSegmentationRule(
        experiment.applicationName,
        experimentName(experiment),
        { context: JSON.parse(testContext) }
      ),
    onSuccess: (data) => {
      setTestResult(JSON.stringify(data, null, 2));
    },
    onError: () => toast.error("Rule test failed"),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Segmentation rule</CardTitle>
          <CardDescription>
            JSON rule evaluated when assigning users to this experiment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            rows={8}
            disabled={readOnly}
            placeholder='{"country": "US"}'
          />
          {!readOnly && (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              Save rule
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test segmentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="test-context">Test context (JSON)</Label>
            <Textarea
              id="test-context"
              value={testContext}
              onChange={(e) => setTestContext(e.target.value)}
              rows={4}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
          >
            Run test
          </Button>
          {testResult && (
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              {testResult}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
