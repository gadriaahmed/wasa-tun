import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { experimentName } from "@/lib/experiment-utils";
import type { Experiment } from "@/types";

interface ApiCallsTabProps {
  experiment: Experiment;
}

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

export function ApiCallsTab({ experiment }: ApiCallsTabProps) {
  const name = experimentName(experiment);
  const app = experiment.applicationName;

  const samples = [
    {
      title: "Get assignment (curl)",
      code: `curl -u USER:PASS \\
  "${API_BASE}/api/v1/assignments/applications/${app}/experiments/${name}/users/USER_ID"`,
    },
    {
      title: "Post event (curl)",
      code: `curl -u USER:PASS -H "Content-Type: application/json" -X POST \\
  -d '{"events":[{"name":"click","properties":{}}]}' \\
  "${API_BASE}/api/v1/events/applications/${app}/experiments/${name}/users/USER_ID"`,
    },
    {
      title: "Java",
      code: `Assignment assignment = wasabi.getAssignment("${app}", "${name}", userId);`,
    },
    {
      title: "JavaScript",
      code: `const assignment = await wasabi.getAssignment("${app}", "${name}", userId);`,
    },
  ];

  return (
    <div className="space-y-4">
      {samples.map((sample) => (
        <Card key={sample.title}>
          <CardHeader>
            <CardTitle className="text-base">{sample.title}</CardTitle>
            <CardDescription>Sample integration code</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              {sample.code}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
