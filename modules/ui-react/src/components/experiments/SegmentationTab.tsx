import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { testSegmentationRule } from "@/api/applications";
import { updateExperimentRule } from "@/api/experiments";
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

function extractApiError(err: unknown): string {
  const message = (
    err as { response?: { data?: { error?: { message?: string } } } }
  )?.response?.data?.error?.message;
  return message ?? "Request failed";
}

export function SegmentationTab({
  experiment,
  readOnly = false,
  onUpdated,
}: SegmentationTabProps) {
  const [rule, setRule] = useState(experiment.rule ?? "");
  const [profileJson, setProfileJson] = useState('{"country":"US"}');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    setRule(experiment.rule ?? "");
  }, [experiment.rule]);

  const saveMutation = useMutation({
    mutationFn: () => updateExperimentRule(experiment.id, rule),
    onSuccess: () => {
      toast.success("Segmentation rule saved");
      onUpdated();
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const testMutation = useMutation({
    mutationFn: () => {
      const profile = JSON.parse(profileJson) as Record<string, unknown>;
      return testSegmentationRule(
        experiment.applicationName,
        experimentName(experiment),
        profile
      );
    },
    onSuccess: (data: { result?: boolean }) => {
      const passed = data.result === true;
      setTestResult(
        passed
          ? "Rule PASSES for these profile inputs."
          : "Rule FAILS for these profile inputs."
      );
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Segmentation rule</CardTitle>
          <CardDescription>
            Rule expression evaluated when assigning users (e.g.{" "}
            <code className="text-xs">country == &quot;US&quot;</code>). Leave
            empty for no segmentation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            rows={8}
            disabled={readOnly}
            placeholder='country == "US"'
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
          <CardDescription>
            Provide profile attributes to test whether the saved rule matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="test-profile">Profile (JSON object)</Label>
            <Textarea
              id="test-profile"
              value={profileJson}
              onChange={(e) => setProfileJson(e.target.value)}
              rows={4}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              try {
                JSON.parse(profileJson);
                testMutation.mutate();
              } catch {
                toast.error("Profile must be valid JSON");
              }
            }}
            disabled={testMutation.isPending}
          >
            Run test
          </Button>
          {testResult && (
            <p className="rounded-lg bg-muted p-3 text-sm">{testResult}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
