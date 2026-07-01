import { useQuery } from "@tanstack/react-query";
import { fetchExperimentPages } from "@/api/experiments";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PagesTabProps {
  experimentId: string;
  readOnly?: boolean;
}

export function PagesTab({ experimentId }: PagesTabProps) {
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["experiment-pages", experimentId],
    queryFn: () => fetchExperimentPages(experimentId),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch assignment pages</CardTitle>
        <CardDescription>
          Pages associated with this experiment for batch assignment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading pages...</p>
        ) : pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pages linked to this experiment.
          </p>
        ) : (
          <ul className="space-y-2">
            {pages.map((page) => {
              const p = page as { name?: string; pageName?: string };
              return (
              <li
                key={p.name ?? p.pageName}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                {p.name ?? p.pageName}
              </li>
            );})}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
