import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { assignRole } from "@/api/auth";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function UserAccess() {
  const { username = "", appname = "", access = "" } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [status, setStatus] = useState<"pending" | "done" | "error">("pending");

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      return;
    }
    const decodedUser = decodeURIComponent(username);
    const decodedApp = decodeURIComponent(appname);
    const decodedAccess = decodeURIComponent(access);

    assignRole({
      roleList: [
        {
          applicationName: decodedApp,
          role: decodedAccess,
          userID: decodedUser,
        },
      ],
    })
      .then(() => {
        setStatus("done");
        toast.success(`Granted ${decodedAccess} on ${decodedApp} to ${decodedUser}`);
        navigate("/users", { replace: true });
      })
      .catch(() => {
        setStatus("error");
        toast.error("Failed to assign role");
      });
  }, [access, appname, isAdmin, isAuthenticated, navigate, username]);

  if (!isAuthenticated) {
    return null;
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>
            Admin privileges are required to grant user access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Granting user access</CardTitle>
        <CardDescription>
          Assigning {decodeURIComponent(access)} on{" "}
          {decodeURIComponent(appname)} to {decodeURIComponent(username)}...
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "pending" && <Skeleton className="h-8 w-48" />}
        {status === "done" && (
          <p className="text-sm text-green-600">Role assigned successfully.</p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-500">Failed to assign role.</p>
        )}
      </CardContent>
    </Card>
  );
}
