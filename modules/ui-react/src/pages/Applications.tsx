import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchApplications } from "@/api/applications";
import { useAuth } from "@/hooks/useAuth";
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
import { Skeleton } from "@/components/ui/skeleton";

export function Applications() {
  const { isAdmin } = useAuth();
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  if (!isAdmin) {
    return (
      <p className="text-sm text-muted-foreground">
        You need admin access to view applications.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications</CardTitle>
        <CardDescription>
          Manage batch-assignment applications and their operational tools.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : isError ? (
          <p className="text-sm text-red-500">Failed to load applications.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((app) => (
                <TableRow key={app.applicationName}>
                  <TableCell className="font-medium">
                    {app.applicationName}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        to={`/applications/${encodeURIComponent(app.applicationName)}/priorities`}
                      >
                        Priorities
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        to={`/applications/${encodeURIComponent(app.applicationName)}/pages`}
                      >
                        Pages
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        to={`/applications/${encodeURIComponent(app.applicationName)}/logs`}
                      >
                        Logs
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
