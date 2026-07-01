import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  fetchApplicationPages,
  fetchPageExperiments,
} from "@/api/applications";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

export function ApplicationPages() {
  const { appName = "" } = useParams();
  const decodedApp = decodeURIComponent(appName);
  const [selectedPage, setSelectedPage] = useState<string>("");

  const pagesQuery = useQuery({
    queryKey: ["application-pages", decodedApp],
    queryFn: () => fetchApplicationPages(decodedApp),
    enabled: !!decodedApp,
  });

  const experimentsQuery = useQuery({
    queryKey: ["page-experiments", decodedApp, selectedPage],
    queryFn: () => fetchPageExperiments(decodedApp, selectedPage),
    enabled: !!selectedPage,
  });

  const pages = pagesQuery.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Page manager — {decodedApp}</CardTitle>
          <CardDescription>
            View experiments associated with batch-assignment pages.
          </CardDescription>
        </div>
        <Button variant="outline" asChild>
          <Link to="/applications">Back</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {pagesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading pages...</p>
        ) : pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pages found.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {pages.map((page) => (
                <Button
                  key={page.name}
                  variant={selectedPage === page.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPage(page.name)}
                >
                  {page.name}
                </Button>
              ))}
            </div>
            {selectedPage && (
              <div>
                <h3 className="mb-2 text-sm font-medium">
                  Experiments on {selectedPage}
                </h3>
                {experimentsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (experimentsQuery.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No experiments linked.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(experimentsQuery.data ?? []).map((exp) => {
                      const item = exp as { id: string; label?: string };
                      return (
                        <li
                          key={item.id}
                          className="rounded-lg border px-3 py-2 text-sm"
                        >
                          <Link
                            to={`/experiments/${item.id}`}
                            className="text-indigo-600 hover:underline"
                          >
                            {item.label ?? item.id}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
