import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  assignRole,
  deleteRoleForApplication,
  getUsersRoles,
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
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserRoleEntry } from "@/types";

export function Users() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [appName, setAppName] = useState("");
  const [role, setRole] = useState("READ");

  const { data = [], isLoading } = useQuery({
    queryKey: ["users-roles"],
    queryFn: getUsersRoles,
    enabled: isAdmin,
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      assignRole({
        roleList: [{ applicationName: appName, role, userID: userId }],
      }),
    onSuccess: () => {
      toast.success("Role assigned");
      setUserId("");
      void queryClient.invalidateQueries({ queryKey: ["users-roles"] });
    },
    onError: () => toast.error("Failed to assign role"),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ app, user }: { app: string; user: string }) =>
      deleteRoleForApplication(app, user),
    onSuccess: () => {
      toast.success("Role removed");
      void queryClient.invalidateQueries({ queryKey: ["users-roles"] });
    },
    onError: () => toast.error("Failed to remove role"),
  });

  if (!isAdmin) {
    return (
      <p className="text-sm text-muted-foreground">
        You need admin access to manage users.
      </p>
    );
  }

  const rows = (data as UserRoleEntry[]).flatMap((entry) =>
    entry.userID
      ? [{ ...entry }]
      : []
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Users &amp; roles</CardTitle>
          <CardDescription>
            Cross-application role management for Wasabi users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={`${row.userID}-${row.applicationName}-${i}`}>
                    <TableCell>{row.userID}</TableCell>
                    <TableCell>{row.applicationName}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          deleteMutation.mutate({
                            app: row.applicationName,
                            user: row.userID,
                          })
                        }
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign role</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appName">Application</Label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {["READ", "CREATE", "UPDATE", "DELETE", "ADMIN"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <Button
            disabled={
              !userId.trim() || !appName.trim() || assignMutation.isPending
            }
            onClick={() => assignMutation.mutate()}
          >
            Assign
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
