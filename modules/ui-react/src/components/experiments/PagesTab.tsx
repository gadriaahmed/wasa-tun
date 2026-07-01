import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { fetchApplicationPages } from "@/api/applications";
import {
  fetchExperimentPages,
  removeExperimentPage,
  saveExperimentPages,
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
import { Label } from "@/components/ui/label";
import type { PageInfo } from "@/types";

interface PagesTabProps {
  experimentId: string;
  applicationName: string;
  readOnly?: boolean;
}

function pageName(page: PageInfo): string {
  return page.name;
}

function extractApiError(err: unknown): string {
  const message = (
    err as { response?: { data?: { error?: { message?: string } } } }
  )?.response?.data?.error?.message;
  return message ?? "Request failed";
}

export function PagesTab({
  experimentId,
  applicationName,
  readOnly = false,
}: PagesTabProps) {
  const queryClient = useQueryClient();
  const [newPageName, setNewPageName] = useState("");

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["experiment-pages", experimentId],
    queryFn: () => fetchExperimentPages(experimentId),
  });

  const { data: appPages = [] } = useQuery({
    queryKey: ["application-pages", applicationName],
    queryFn: () => fetchApplicationPages(applicationName),
    enabled: !!applicationName,
  });

  const typedPages = pages as PageInfo[];

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["experiment-pages", experimentId],
    });

  const addMutation = useMutation({
    mutationFn: (pageName: string) =>
      saveExperimentPages(experimentId, [
        { name: pageName, allowNewAssignment: true },
      ]),
    onSuccess: () => {
      toast.success("Page added");
      setNewPageName("");
      void invalidate();
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: (updatedPages: PageInfo[]) =>
      saveExperimentPages(
        experimentId,
        updatedPages.map((p) => ({
          name: pageName(p),
          allowNewAssignment: p.allowNewAssignment ?? false,
        }))
      ),
    onSuccess: () => {
      toast.success("Page settings saved");
      void invalidate();
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const removeMutation = useMutation({
    mutationFn: (pageNameToRemove: string) =>
      removeExperimentPage(experimentId, pageNameToRemove),
    onSuccess: () => {
      toast.success("Page removed");
      void invalidate();
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const handleAddPage = () => {
    const name = newPageName.trim();
    if (!name) {
      toast.error("Enter a page name");
      return;
    }
    if (typedPages.some((p) => pageName(p).toLowerCase() === name.toLowerCase())) {
      toast.error("This page is already linked to the experiment");
      return;
    }
    addMutation.mutate(name);
  };

  const suggestedPages = appPages
    .map((p) => p.name)
    .filter(
      (name) =>
        !typedPages.some(
          (linked) => pageName(linked).toLowerCase() === name.toLowerCase()
        )
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch assignment pages</CardTitle>
        <CardDescription>
          Link this experiment to pages for batch assignment API calls under{" "}
          <code className="text-xs">
            /assignments/applications/{applicationName}/pages/&#123;page&#125;/users/&#123;user&#125;
          </code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading pages...</p>
        ) : typedPages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pages linked yet. Add a page name below to enable batch
            assignment.
          </p>
        ) : (
          <ul className="space-y-2">
            {typedPages.map((page) => {
              const name = pageName(page);
              return (
                <li
                  key={name}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{name}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={page.allowNewAssignment ?? false}
                        disabled={readOnly || toggleMutation.isPending}
                        onChange={(e) => {
                          const updated = typedPages.map((p) =>
                            pageName(p) === name
                              ? {
                                  ...p,
                                  allowNewAssignment: e.target.checked,
                                }
                              : p
                          );
                          toggleMutation.mutate(updated);
                        }}
                      />
                      Allow new assignments
                    </label>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMutation.mutate(name)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!readOnly && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="new-page-name">Add page</Label>
                <Input
                  id="new-page-name"
                  list="page-suggestions"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="checkout_page"
                  className="min-w-[240px]"
                />
                <datalist id="page-suggestions">
                  {suggestedPages.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <Button
                disabled={!newPageName.trim() || addMutation.isPending}
                onClick={handleAddPage}
              >
                Add page
              </Button>
            </div>
            {suggestedPages.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Existing pages in this app: {suggestedPages.join(", ")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
