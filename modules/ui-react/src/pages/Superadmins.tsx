import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  addSuperadmin,
  getSuperadmins,
  removeSuperadmin,
} from "@/api/auth";
import { useAuth } from "@/hooks/useAuth";
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
import type { Superadmin } from "@/types";

export function Superadmins() {
  const { isAdmin, isSuperadmin } = useAuth();
  const queryClient = useQueryClient();
  const [userID, setUserID] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["superadmins"],
    queryFn: getSuperadmins,
    enabled: isAdmin,
  });

  const addMutation = useMutation({
    mutationFn: () => addSuperadmin(userID),
    onSuccess: () => {
      toast.success("Superadmin added");
      setUserID("");
      void queryClient.invalidateQueries({ queryKey: ["superadmins"] });
    },
    onError: () => toast.error("Failed to add superadmin"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeSuperadmin(id),
    onSuccess: () => {
      toast.success("Superadmin removed");
      void queryClient.invalidateQueries({ queryKey: ["superadmins"] });
    },
    onError: () => toast.error("Failed to remove superadmin"),
  });

  if (!isAdmin) {
    return (
      <p className="text-sm text-muted-foreground">
        You need admin access to manage superadmins.
      </p>
    );
  }

  const admins = data as Superadmin[];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Superadmins</CardTitle>
          <CardDescription>
            Users with full platform access across all applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <ul className="space-y-2">
              {admins.map((admin) => (
                <li
                  key={admin.userID}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span>{admin.userID}</span>
                  {isSuperadmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMutation.mutate(admin.userID)}
                    >
                      Remove
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {isSuperadmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add superadmin</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="superadmin-id">User ID</Label>
              <Input
                id="superadmin-id"
                value={userID}
                onChange={(e) => setUserID(e.target.value)}
              />
            </div>
            <Button
              disabled={!userID.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              Add
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
