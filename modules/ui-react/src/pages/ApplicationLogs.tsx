import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchLogs } from "@/api/applications";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import type { AuditLogEntry } from "@/types";

export function ApplicationLogs() {
  const { appName = "" } = useParams();
  const decodedApp = decodeURIComponent(appName);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["logs", decodedApp, page],
    queryFn: () => fetchLogs(decodedApp, page),
    enabled: !!decodedApp,
  });

  const logs: AuditLogEntry[] = data?.logs ?? [];
  const total = data?.totalEntries ?? logs.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Audit logs — {decodedApp}</CardTitle>
          <CardDescription>
            Paginated audit trail for application activity.
          </CardDescription>
        </div>
        <Button variant="outline" asChild>
          <Link to="/applications">Back</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No log entries.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, i) => (
                  <TableRow key={log.id ?? `${log.time}-${i}`}>
                    <TableCell>{log.time ?? "-"}</TableCell>
                    <TableCell>{log.user ?? "-"}</TableCell>
                    <TableCell>{log.action ?? "-"}</TableCell>
                    <TableCell>{log.message ?? log.experimentLabel ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} — {total} total entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
