import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchDailyStatistics,
  fetchExperimentStatistics,
} from "@/api/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ResultsTabProps {
  experimentId: string;
}

export function ResultsTab({ experimentId }: ResultsTabProps) {
  const statsQuery = useQuery({
    queryKey: ["statistics", experimentId],
    queryFn: () => fetchExperimentStatistics(experimentId),
  });

  const dailiesQuery = useQuery({
    queryKey: ["statistics-dailies", experimentId],
    queryFn: () => fetchDailyStatistics(experimentId),
  });

  if (statsQuery.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  const buckets = statsQuery.data?.buckets ?? {};
  const bucketRows = Object.values(buckets).map((b) => {
    const bucket = b as { label: string; count?: number; improvement?: number };
    return {
      label: bucket.label,
      count: bucket.count ?? 0,
      improvement: bucket.improvement ?? 0,
    };
  });

  const chartData =
    dailiesQuery.data?.days?.map(
      (day: { date: string; buckets?: Record<string, { count?: number }> }) => {
        const row: Record<string, string | number> = { date: day.date };
        Object.entries(day.buckets ?? {}).forEach(([label, stats]) => {
          row[label] = stats.count ?? 0;
        });
        return row;
      }
    ) ?? [];

  const bucketLabels =
    chartData.length > 0
      ? Object.keys(chartData[0]).filter((k) => k !== "date")
      : bucketRows.map((b) => b.label);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bucket statistics</CardTitle>
          <CardDescription>
            Assignment counts and improvement vs control.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bucketRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No statistics available yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Bucket</th>
                    <th className="py-2">Count</th>
                    <th className="py-2">Improvement</th>
                  </tr>
                </thead>
                <tbody>
                  {bucketRows.map((row) => (
                    <tr key={row.label} className="border-b">
                      <td className="py-2">{row.label}</td>
                      <td className="py-2">{row.count}</td>
                      <td className="py-2">
                        {row.improvement != null
                          ? `${row.improvement.toFixed(2)}%`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily performance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {bucketLabels.map((label, i) => (
                  <Bar
                    key={label}
                    dataKey={label}
                    fill={`hsl(${220 + i * 40}, 70%, 50%)`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
